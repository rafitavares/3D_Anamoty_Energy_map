# Builds the female version of the atlas body:
#   models/silhueta_f.glb  - female body surface (MPFB / MakeHuman, CC0)
#   models/orgaos_f.glb    - female organs: 'gonadas' (ovaries), 'reprodutor'
#                            (uterus, tubes, vagina) and 'mamas' (mammary glands),
#                            modeled here procedurally (original work, CC0).
#
# The female body is fitted to the male Z-Anatomy model (same height, back
# aligned) so the shared internal organs, chakras and aura stay in place.
#
# Requires the MPFB extension installed in Blender (extensions.blender.org/add-ons/mpfb).
# Usage:
#   blender -b --python tools/female_export.py -- <models_dir>
import bpy, bmesh, sys, os, math
from mathutils import Vector, Matrix

MODELS = sys.argv[sys.argv.index('--') + 1]

from bl_ext.user_default.mpfb.services.humanservice import HumanService
from bl_ext.user_default.mpfb.services.targetservice import TargetService

# Blender coordinates: z up, front = -y, +x = body's left.

def world_verts(o):
    mw = o.matrix_world
    return [mw @ v.co for v in o.data.vertices]

def bounds(vs):
    return (Vector((min(v.x for v in vs), min(v.y for v in vs), min(v.z for v in vs))),
            Vector((max(v.x for v in vs), max(v.y for v in vs), max(v.z for v in vs))))

def back_y(vs, z0, z1):
    """Most posterior point of the torso midline between two heights."""
    sel = [v.y for v in vs if z0 < v.z < z1 and abs(v.x) < 0.04]
    return max(sel)

def apply_all_modifiers(o):
    bpy.ops.object.select_all(action='DESELECT')
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    for m in list(o.modifiers):
        bpy.ops.object.modifier_apply(modifier=m.name)

def bake(o, name):
    """Freeze shape keys + modifiers (mask, armature) into a plain mesh object."""
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(o.evaluated_get(dg), depsgraph=dg)
    me.transform(o.matrix_world)
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob

# ---------------------------------------------------------------- reference
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=os.path.join(MODELS, 'silhueta.glb'))
male = [o for o in bpy.context.selected_objects if o.type == 'MESH'][0]
mv = world_verts(male)
mmin, mmax = bounds(mv)
male_h = mmax.z - mmin.z
male_back = back_y(mv, 1.0, 1.3)
print(f'MALE height={male_h:.3f} back_y={male_back:.3f}')

# ---------------------------------------------------------------- female body
macro = TargetService.get_default_macro_info_dict()
macro.update(gender=0.0, age=0.5, muscle=0.5, weight=0.5, proportions=0.6, height=0.5,
             cupsize=0.5, firmness=0.6)
# detailed_helpers keeps the joint-* vertex groups the rig needs to fit the body.
body = HumanService.create_human(mask_helpers=True, detailed_helpers=True, extra_vertex_groups=True,
                                 scale=0.1, macro_detail_dict=macro)
rig = HumanService.add_builtin_rig(body, 'default')

# Lower the arms from MakeHuman's A-pose to the anatomical position (~10° from the body).
bpy.ops.object.select_all(action='DESELECT')
bpy.context.view_layer.objects.active = rig
rig.select_set(True)
bpy.ops.object.mode_set(mode='POSE')
rig_rot = rig.matrix_world.to_quaternion()
# Angles from vertical, matching the Z-Anatomy male arms (hands ~0.24-0.30 m from the midline).
ARM_ANGLE, FOREARM_ANGLE = 9, 13
for side, s in (('L', 1), ('R', -1)):
    # Each segment is a two-bone chain: shoulder -> elbow, elbow -> wrist.
    for name, end, angle in ((f'upperarm01.{side}', f'lowerarm01.{side}', ARM_ANGLE),
                             (f'lowerarm01.{side}', f'wrist.{side}', FOREARM_ANGLE)):
        bpy.context.view_layer.update()
        pb = rig.pose.bones[name]
        # Posed direction in world space, then the rotation that brings it to the target.
        cur = (rig_rot @ (rig.pose.bones[end].head - pb.head)).normalized()
        target = Vector((s * math.sin(math.radians(angle)), 0.0, -math.cos(math.radians(angle))))
        q_arm = rig_rot.inverted() @ cur.rotation_difference(target) @ rig_rot
        # Rotate the posed bone about its head, in armature space; children follow.
        pivot = Matrix.Translation(pb.head)
        pb.matrix = pivot @ q_arm.to_matrix().to_4x4() @ pivot.inverted() @ pb.matrix
bpy.ops.object.mode_set(mode='OBJECT')
bpy.context.view_layer.update()
baked = bake(body, 'silhueta_f')
bpy.data.objects.remove(body, do_unlink=True)
bpy.data.objects.remove(rig, do_unlink=True)
body = baked
bpy.ops.object.select_all(action='DESELECT')
bpy.context.view_layer.objects.active = body
body.select_set(True)

# Fit: same height as the male model, feet on the ground, back aligned.
fv = world_verts(body)
fmin, fmax = bounds(fv)
k = male_h / (fmax.z - fmin.z)
body.scale = (k, k, k)
bpy.context.view_layer.update()
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
fv = world_verts(body)
fmin, fmax = bounds(fv)
body.location = (-(fmin.x + fmax.x) / 2, male_back - back_y(fv, 1.0, 1.3), mmin.z - fmin.z)
bpy.context.view_layer.update()
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
# The shared organs come from the male model, so the female torso must be at
# least as deep: match front-to-back depth at the sternum (midline, between the breasts).
def front_y(vs, z0, z1):
    return min(v.y for v in vs if z0 < v.z < z1 and abs(v.x) < 0.015)
fv = world_verts(body)
male_depth = male_back - front_y(mv, 1.22, 1.30)
fem_depth = back_y(fv, 1.0, 1.3) - front_y(fv, 1.22, 1.30)
ky = max(1.0, male_depth / fem_depth)
print(f'DEPTH male={male_depth:.3f} female={fem_depth:.3f} scale_y={ky:.3f}')
for v in body.data.vertices:
    v.co.y = male_back - (male_back - v.co.y) * ky
body.data.update()
fv = world_verts(body)
wrists = [v for v in fv if 0.82 < v.z < 0.9 and v.x > 0.15]
print(f'WRIST x={min(v.x for v in wrists):.3f}..{max(v.x for v in wrists):.3f} (male hand ~0.24..0.30)')
print('FEMALE fitted bounds', [round(c, 3) for c in bounds(fv)[0]], [round(c, 3) for c in bounds(fv)[1]])

# ---------------------------------------------------------------- organ modeling helpers
def catmull(points, samples):
    pts = [points[0]] + points + [points[-1]]
    out = []
    for i in range(1, len(pts) - 2):
        p0, p1, p2, p3 = pts[i - 1], pts[i], pts[i + 1], pts[i + 2]
        for j in range(samples):
            t = j / samples
            t2, t3 = t * t, t * t * t
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3))
    out.append(points[-1])
    return out

def sweep(name, points, radius, flat=1.0, ring=20, samples=8, cap=True, side_axis=None):
    """Tube along a smooth path. radius(t) -> width; flat scales the second axis."""
    path = catmull([Vector(p) for p in points], samples)
    bm = bmesh.new()
    rings = []
    n = len(path)
    for i, p in enumerate(path):
        t = i / (n - 1)
        tan = (path[min(i + 1, n - 1)] - path[max(i - 1, 0)]).normalized()
        u = Vector(side_axis) if side_axis else (tan.cross(Vector((0, 0, 1))) if abs(tan.z) < 0.95 else Vector((1, 0, 0)))
        u = (u - tan * u.dot(tan)).normalized()
        v = tan.cross(u).normalized()
        r = radius(t)
        rings.append([bm.verts.new(p + u * math.cos(a) * r + v * math.sin(a) * r * flat)
                      for a in (2 * math.pi * j / ring for j in range(ring))])
    for a, b in zip(rings, rings[1:]):
        for j in range(ring):
            bm.faces.new((a[j], a[(j + 1) % ring], b[(j + 1) % ring], b[j]))
    if cap:
        for rr, p in ((rings[0], path[0]), (rings[-1], path[-1])):
            c = bm.verts.new(p)
            for j in range(ring):
                bm.faces.new((rr[j], rr[(j + 1) % ring], c) if rr is rings[-1] else (rr[(j + 1) % ring], rr[j], c))
    me = bpy.data.meshes.new(name)
    bm.normal_update()
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob

def ellipsoid(name, center, radii, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=20, radius=1, location=center, rotation=rot)
    ob = bpy.context.active_object
    ob.name = name
    ob.scale = radii
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    return ob

def join(name, objs):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    ob = bpy.context.active_object
    ob.name = name
    ob.data.name = name
    # The app reads only mesh geometry, so bake the object transform into the vertices.
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    sub = ob.modifiers.new('smooth', 'SUBSURF')
    sub.levels = 1
    apply_all_modifiers(ob)
    for p in ob.data.polygons:
        p.use_smooth = True
    return ob

def smoothstep(a, b, x):
    x = max(0.0, min(1.0, (x - a) / (b - a)))
    return x * x * (3 - 2 * x)

# ---------------------------------------------------------------- uterus, tubes, vagina
# Anteverted, anteflexed uterus resting on the bladder (bladder top ≈ z 0.88),
# cervix behind the bladder, fundus tipped forward.
cervix = Vector((0, 0.050, 0.858))
uterus_path = [cervix, (0, 0.040, 0.875), (0, 0.026, 0.893), (0, 0.010, 0.908), (0, -0.004, 0.918), (0, -0.012, 0.922)]

def uterus_r(t):
    # cervix ~1.2 cm, isthmus, body widening toward the fundus, rounded dome
    base = 0.012 + 0.014 * smoothstep(0.25, 0.75, t)
    dome = math.sqrt(max(0.0, 1 - smoothstep(0.82, 1.0, t) ** 2))
    return max(0.002, base * (0.25 + 0.75 * dome) if t > 0.82 else base)

uterus = sweep('uterus', uterus_path, uterus_r, flat=0.62, ring=28, samples=10, side_axis=(1, 0, 0))

vagina = sweep('vagina', [(0, 0.058, 0.852), (0, 0.044, 0.832), (0, 0.026, 0.808), (0, 0.010, 0.790), (0, 0.002, 0.782)],
               lambda t: 0.0145 - 0.002 * t, flat=0.38, ring=20, samples=8, cap=False, side_axis=(1, 0, 0))

parts = [uterus, vagina]
ovaries = []
for s in (1, -1):
    tube = sweep(f'tube_{s}', [(s * 0.020, -0.006, 0.921), (s * 0.045, -0.002, 0.928), (s * 0.068, 0.010, 0.924),
                                (s * 0.084, 0.028, 0.910), (s * 0.080, 0.044, 0.896)],
                 lambda t: 0.0024 + 0.0034 * smoothstep(0.35, 1.0, t), ring=12, samples=10, cap=False)
    parts.append(tube)
    # fimbriae: finger-like fringe at the open end of the tube, reaching toward the ovary
    end = Vector((s * 0.080, 0.044, 0.896))
    for i in range(9):
        a = 2 * math.pi * i / 9
        d = Vector((s * 0.25 * math.cos(a), 0.55 + 0.35 * math.sin(a), -0.6 + 0.25 * math.cos(a))).normalized()
        parts.append(sweep(f'fimbria_{s}_{i}', [end, end + d * 0.006, end + d * 0.012],
                           lambda t: 0.0016 * (1 - 0.6 * t), ring=8, samples=4))
    # ovarian ligament (uterus -> ovary)
    parts.append(sweep(f'ovarian_ligament_{s}', [(s * 0.020, 0.012, 0.903), (s * 0.040, 0.026, 0.896), (s * 0.056, 0.036, 0.890)],
                       lambda t: 0.0017, ring=8, samples=6))
    ovaries.append(ellipsoid(f'ovary_{s}', (s * 0.066, 0.040, 0.886), (0.010, 0.008, 0.016), rot=(0.3, 0, s * 0.35)))

reprodutor = join('reprodutor', parts)
gonadas = join('gonadas', ovaries)

# ---------------------------------------------------------------- mammary glands
# Find each nipple as the most anterior point of the chest on that side.
fv = world_verts(body)
glands = []
for s in (1, -1):
    chest = [v for v in fv if 1.18 < v.z < 1.45 and 0.03 < s * v.x < 0.17]
    nipple = min(chest, key=lambda v: v.y)
    wall = nipple + Vector((0, 0.045, 0))          # toward the chest wall
    print(f'NIPPLE {s}: {tuple(round(c, 3) for c in nipple)}')
    lobes = []
    for i in range(15):
        a = 2 * math.pi * i / 15 + 0.2
        radial = Vector((s * math.cos(a), 0, math.sin(a)))
        r = 0.040 + 0.008 * math.sin(3 * a)
        c = wall + radial * r + Vector((0, -0.012, 0))
        # tail of Spence: the upper-outer lobes reach toward the armpit
        if math.cos(a) > 0.3 and math.sin(a) > 0.2:
            c += radial * 0.012
        lobe = ellipsoid(f'lobe_{s}_{i}', c, (0.013, 0.010, 0.017), rot=(0, -a * s, 0))
        lobes.append(lobe)
        # lactiferous duct from lobe to nipple, widening into a sinus just behind it
        lobes.append(sweep(f'duct_{s}_{i}', [c, c.lerp(nipple, 0.55) + Vector((0, 0.004, 0)), nipple + Vector((0, 0.006, 0))],
                           lambda t: 0.0016 + 0.0016 * smoothstep(0.6, 0.9, t), ring=8, samples=6))
    lobes.append(ellipsoid(f'nipple_{s}', nipple + Vector((0, 0.003, 0)), (0.006, 0.004, 0.006)))
    glands.extend(lobes)
mamas = join('mamas', glands)

# ---------------------------------------------------------------- export
def export(objs, path):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=path, export_format='GLB', use_selection=True, export_apply=True,
        export_materials='NONE', export_yup=True,
        export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=7,
        export_draco_position_quantization=14, export_draco_normal_quantization=10)

body.name = body.data.name = 'silhueta_f'
for g in list(body.vertex_groups):
    body.vertex_groups.remove(g)
for p in body.data.polygons:
    p.use_smooth = True
export([body], os.path.join(MODELS, 'silhueta_f.glb'))
export([gonadas, reprodutor, mamas], os.path.join(MODELS, 'orgaos_f.glb'))
print('DONE', len(body.data.polygons), 'body polys')
