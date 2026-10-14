# Extrai do Z-Anatomy os órgãos usados pelo atlas, junta as peças de cada órgão,
# aplica modificadores, reduz polígonos e exporta um .glb (Draco) por grupo.
#
# Uso:
#   blender -b --factory-startup --disable-autoexec Startup.blend \
#       --python tools/zanatomy_export.py -- <pasta_saida> [grupo ...]
#
# Modelos: Z-Anatomy (CC BY-SA 4.0), derivado de BodyParts3D (CC BY-SA 2.1 JP).
import bpy, bmesh, sys, re, os, json

args = sys.argv[sys.argv.index('--') + 1:]
OUT = args[0]
ONLY = set(args[1:])
os.makedirs(OUT, exist_ok=True)

def by_names(*names):
    return lambda o: o.name in names
def by_regex(rx):
    r = re.compile(rx, re.I)
    return lambda o: bool(r.search(o.name))
def in_coll(*colls):
    return lambda o: any(c.name in colls for c in o.users_collection)

# id do atlas -> (regra de seleção, orçamento de triângulos)
ORGANS = {
    'coracao': (in_coll('Heart'), 40000),
    'pulmao_e': (by_names('Superior lobe of left lung', 'Inferior lobe of left lung'), 16000),
    'pulmao_d': (by_names('Superior lobe of right lung', 'Middle lobe of right lung', 'Inferior lobe of right lung'), 16000),
    'figado': (by_names('Liver'), 14000),
    'vesicula': (by_names('Gallbladder'), 3000),
    'estomago': (by_names('Stomach'), 10000),
    'pancreas': (by_names('Pancreas'), 8000),
    'baco': (by_names('Spleen'), 6000),
    'rim_e': (by_names('Kidney.l', 'Renal pelvis.l'), 8000),
    'rim_d': (by_names('Kidney.r', 'Renal pelvis.r'), 8000),
    'suprarrenais': (by_names('Suprarenal gland.l', 'Suprarenal gland.r'), 6000),
    'tireoide': (by_names('Thyroid gland'), 4000),
    'timo': (by_names('Left lobe of thymus', 'Right lobe of thymus'), 8000),
    'laringe': (by_names('Trachea', 'Epiglottis', 'Thyroid cartilage'), 14000),
    'intestinos': (by_names('Duodenum', 'Ascending colon', 'Transverse colon', 'Descending colon',
                            'Sigmoid colon', 'Vermiform appendix'), 16000),
    'bexiga': (by_names('Urinary bladder'), 4000),
    'gonadas': (by_names('Testis.l', 'Testis.r'), 4000),
    'reprodutor': (by_names('Prostate', 'Seminal gland.l', 'Seminal gland.r', 'Corpus cavernosum of penis',
                            'Corpus spongiosum of penis', 'Glans penis'), 10000),
    'hipofise': (by_names('Adenohypophysis', 'Neurohypophysis'), 3000),
    'pineal': (by_names('Pineal gland'), 2000),
    'cerebro_sup': (in_coll('Cerebrum'), 70000),
    'cerebro_inf': (in_coll('Cerebellum', 'Brainstem'), 30000),
    'olho_e': (by_regex(r'^(?:.*eyeball.*|cornea|lens|sclera|retina|vitreous body)\.l$'), 6000),
    'olho_d': (by_regex(r'^(?:.*eyeball.*|cornea|lens|sclera|retina|vitreous body)\.r$'), 6000),
    'ouvidos': (by_regex(r'^(cochlea|vestibule|tympanic membrane)\.[lr]$'), 8000),
    'nariz': (by_regex(r'^(mucosa of nasal cavity|.*nasal (septal )?cartilage.*)'), 6000),
    'coluna': (in_coll('Vertebral column'), 60000),
    'medula': (by_names('Spinal dura'), 8000),
}
SKELETON = (in_coll('1: Skeletal system'), 160000)
# Silhueta do corpo a partir da musculatura superficial + crânio.
SILHOUETTE = (in_coll('Superficial muscles', 'Muscles of head', 'Muscles of hand', 'Muscles of foot',
                      'Cranium', 'Mandible'), 90000)

# Rótulos, linhas de chamada e títulos do Z-Anatomy terminam em .g/.j/.i/.t etc.
LABEL = re.compile(r'\.[a-km-qs-z]$')

def gather(rule):
    return [o for o in bpy.data.objects
            if o.type == 'MESH' and len(o.data.vertices) > 50 and not LABEL.search(o.name) and rule(o)]

def build(name, objs, budget):
    """Junta as malhas avaliadas (com modificadores) em coordenadas de mundo."""
    dg = bpy.context.evaluated_depsgraph_get()
    bm = bmesh.new()
    for o in objs:
        ev = o.evaluated_get(dg)
        me = ev.to_mesh()
        me.transform(o.matrix_world)
        bm.from_mesh(me)
        ev.to_mesh_clear()
    bmesh.ops.triangulate(bm, faces=bm.faces[:])
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    ob = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(ob)
    tris = len(mesh.polygons)
    if tris > budget:
        mod = ob.modifiers.new('dec', 'DECIMATE')
        mod.ratio = budget / tris
        bpy.context.view_layer.objects.active = ob
        ob.select_set(True)
        bpy.ops.object.modifier_apply(modifier=mod.name)
    for p in ob.data.polygons:
        p.use_smooth = True
    return ob, tris, len(ob.data.polygons)

def export(objs, path):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=path, export_format='GLB', use_selection=True,
        export_apply=True, export_materials='NONE', export_yup=True,
        export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=7,
        export_draco_position_quantization=14, export_draco_normal_quantization=10,
    )

# Esconde tudo para que a exportação leve apenas o que criamos.
for o in bpy.context.scene.objects:
    o.hide_set(False)
report = {}
made = []
for oid, (rule, budget) in ORGANS.items():
    if ONLY and oid not in ONLY:
        continue
    src = gather(rule)
    if not src:
        print('MISSING', oid); continue
    ob, before, after = build(oid, src, budget)
    made.append(ob)
    report[oid] = {'parts': [o.name for o in src], 'tris_in': before, 'tris_out': after}
    print(f'ORGAN {oid}: {len(src)} partes, {before} -> {after} triângulos')
if made:
    export(made, os.path.join(OUT, 'orgaos.glb'))

if not ONLY or 'esqueleto' in ONLY:
    src = gather(SKELETON[0])
    ob, before, after = build('esqueleto', src, SKELETON[1])
    report['esqueleto'] = {'parts': len(src), 'tris_in': before, 'tris_out': after}
    print(f'SKELETON {len(src)} partes, {before} -> {after}')
    export([ob], os.path.join(OUT, 'esqueleto.glb'))

if not ONLY or 'silhueta' in ONLY:
    src = gather(SILHOUETTE[0])
    ob, before, after = build('silhueta', src, SILHOUETTE[1])
    report['silhueta'] = {'parts': len(src), 'tris_in': before, 'tris_out': after}
    print(f'SILHOUETTE {len(src)} partes, {before} -> {after}')
    export([ob], os.path.join(OUT, 'silhueta.glb'))

with open(os.path.join(OUT, 'zanatomy_report.json'), 'w') as f:
    json.dump(report, f, indent=1, ensure_ascii=False)
print('DONE')
