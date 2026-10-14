# Lista objetos de malha do Z-Anatomy: nome, coleção, nº de vértices, centro e tamanho.
# Uso: blender -b --disable-autoexec Startup.blend --python tools/zanatomy_list.py -- saida.tsv
import bpy, sys
from mathutils import Vector

out = sys.argv[sys.argv.index('--') + 1]
with open(out, 'w') as f:
    f.write('name\tcollections\tverts\tcx\tcy\tcz\tsx\tsy\tsz\n')
    for o in bpy.data.objects:
        if o.type != 'MESH':
            continue
        cs = [c.name for c in o.users_collection]
        bb = [o.matrix_world @ Vector(c) for c in o.bound_box]
        mn = Vector((min(v.x for v in bb), min(v.y for v in bb), min(v.z for v in bb)))
        mx = Vector((max(v.x for v in bb), max(v.y for v in bb), max(v.z for v in bb)))
        c, s = (mn + mx) / 2, mx - mn
        f.write(f"{o.name}\t{'|'.join(cs)}\t{len(o.data.vertices)}\t{c.x:.3f}\t{c.y:.3f}\t{c.z:.3f}\t{s.x:.3f}\t{s.y:.3f}\t{s.z:.3f}\n")
print('OK', out)
