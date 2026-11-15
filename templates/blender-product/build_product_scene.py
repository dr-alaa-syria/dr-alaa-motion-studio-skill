"""
يبني مشهد لقطة منتج سينمائية بهوية الاستوديو (Eevee، خفيف على Intel UHD 630).

التشغيل (يتم تلقائياً عبر studio.py new --type blender --template product):
  blender --background --factory-startup --python build_product_scene.py -- \
      --brand brand/brand.json --out MyShot.blend [--product model.glb] [--frames 90]

المشهد:
  - خلفية منحنية (cyclorama) بلون الحبر، وأرضية تمتد بلا حافة.
  - قاعدة دوّارة رمادية داكنة بحلقة ليمونية مضيئة.
  - المنتج: ملف GLB/GLTF/FBX/OBJ إن أُعطي (يُحجَّم ويوضع على القاعدة تلقائياً)،
    وإلا رمز الهوية مجسّماً من brand.json (الساق بلون الورق، والخط والبكسلات بالليموني).
  - بكسلات ليمونية صغيرة تصعد ببطء (Pixel Trail).
  - إضاءة: مفتاحية + حافتان (واحدة ليمونية) + تعبئة خفيفة.
  - ثلاث كاميرات متحركة: CAM_push (اقتراب بطولي)، CAM_orbit (دوران)، CAM_top (من الأعلى إلى زاوية 3/4).
  - التحويل اللوني Standard حتى تبقى ألوان الهوية دقيقة.
"""

import argparse
import json
import math
import os
import sys

import bmesh
import bpy
from mathutils import Vector

FRAMES = 90  # المدة الأساسية للحركات (3 ثوانٍ). render_shot.py يعيد توقيتها لأي مدة.
TARGET_Z = 0.95


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--brand", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--product", default="")
    p.add_argument("--frames", type=int, default=FRAMES)
    return p.parse_args(argv)


def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hex_rgba(h, alpha=1.0):
    h = h.lstrip("#")
    return tuple(srgb_to_linear(int(h[i:i + 2], 16) / 255) for i in (0, 2, 4)) + (alpha,)


def material(name, color, roughness=0.5, metallic=0.0, emission=None, emission_strength=0.0, coat=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = coat
    if emission is not None:
        key = "Emission Color" if "Emission Color" in bsdf.inputs else "Emission"
        bsdf.inputs[key].default_value = emission
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    return m


def link(obj, coll=None):
    (coll or bpy.context.scene.collection).objects.link(obj)
    return obj


def new_collection(name):
    c = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(c)
    return c


# ------------------------------------------------------------------ الإعداد العام

def setup_scene(frames):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    r = scene.render
    r.engine = "BLENDER_EEVEE"
    r.resolution_x, r.resolution_y = 1920, 1080
    r.resolution_percentage = 50
    r.fps = 30
    r.image_settings.file_format = "PNG"
    r.image_settings.color_mode = "RGBA"
    r.film_transparent = False
    scene.frame_start, scene.frame_end = 1, frames
    ev = scene.eevee
    for attr, val in (("taa_render_samples", 16), ("taa_samples", 8), ("use_raytracing", False),
                      ("use_shadows", True), ("shadow_ray_count", 1), ("shadow_step_count", 2),
                      ("shadow_resolution_scale", 0.5), ("use_volumetric_shadows", False)):
        if hasattr(ev, attr):
            setattr(ev, attr, val)
    vs = scene.view_settings
    vs.view_transform = "Standard"
    vs.look = "None"
    vs.exposure = 0.0
    return scene


def setup_world(scene, brand):
    w = bpy.data.worlds.new("StudioWorld")
    w.use_nodes = True
    bg = w.node_tree.nodes.get("Background")
    bg.inputs["Color"].default_value = hex_rgba(brand["colors"]["ink"])
    bg.inputs["Strength"].default_value = 0.25
    scene.world = w


# ------------------------------------------------------------------ الديكور

def build_cyclorama(brand, coll):
    """أرضية تنحني إلى جدار خلفي بلا حافة"""
    profile = []
    for i in range(12):  # أرضية مستقيمة
        profile.append((-10 + i * (12 / 11), 0.0))
    R = 3.0
    for i in range(1, 13):  # انحناء ربع دائرة
        a = (i / 12) * (math.pi / 2)
        profile.append((2 + R * math.sin(a), R - R * math.cos(a)))
    for i in range(1, 6):  # جدار
        profile.append((5.0, R + i * 1.6))
    me = bpy.data.meshes.new("Cyclorama")
    bm = bmesh.new()
    xs = [-14.0, 14.0]
    verts = [[bm.verts.new((x, y, z)) for (y, z) in profile] for x in xs]
    for k in range(len(profile) - 1):
        bm.faces.new((verts[0][k], verts[0][k + 1], verts[1][k + 1], verts[1][k]))
    bm.to_mesh(me)
    bm.free()
    obj = link(bpy.data.objects.new("Cyclorama", me), coll)
    for poly in me.polygons:
        poly.use_smooth = True
    obj.data.materials.append(material("CycloMat", hex_rgba(brand["colors"]["ink"]), roughness=0.85))
    return obj


def build_pedestal(brand, coll):
    bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=1.15, depth=0.4, location=(0, 0, 0.2))
    ped = bpy.context.active_object
    ped.name = "Pedestal"
    bpy.ops.object.shade_smooth()
    bev = ped.modifiers.new("Bevel", "BEVEL")
    bev.width = 0.02
    bev.segments = 3
    ped.data.materials.append(material("PedestalMat", hex_rgba(brand["colors"]["gray800"]), roughness=0.45, coat=0.0))
    bpy.ops.mesh.primitive_torus_add(major_radius=1.16, minor_radius=0.014, major_segments=128, minor_segments=8, location=(0, 0, 0.395))
    ring = bpy.context.active_object
    ring.name = "AccentRing"
    lime = hex_rgba(brand["colors"]["accent"])
    ring.data.materials.append(material("RingMat", lime, roughness=0.3, emission=lime, emission_strength=6.0))
    for o in (ped, ring):
        for c in o.users_collection:
            c.objects.unlink(o)
        coll.objects.link(o)
    return ped


def build_pixels(brand, coll, frames):
    """بكسلات ليمونية صغيرة تصعد ببطء قرب المنتج"""
    lime = hex_rgba(brand["colors"]["accent"])
    mat = material("PixelMat", lime, roughness=0.4, emission=lime, emission_strength=2.5)
    spots = [(0.95, -0.35, 1.7, 0.06), (1.15, 0.05, 2.05, 0.045), (1.32, -0.2, 2.35, 0.05),
             (1.05, 0.25, 2.55, 0.035), (1.42, 0.12, 1.9, 0.04), (-1.25, 0.3, 1.2, 0.03)]
    for i, (x, y, z, s) in enumerate(spots):
        bpy.ops.mesh.primitive_cube_add(size=s * 2, location=(x, y, z))
        c = bpy.context.active_object
        c.name = f"Pixel_{i}"
        c.data.materials.append(mat)
        for col in c.users_collection:
            col.objects.unlink(c)
        coll.objects.link(c)
        c.keyframe_insert("location", frame=1)
        c.location.z += 0.35 + 0.1 * i
        c.location.x += 0.08
        c.keyframe_insert("location", frame=frames)


# ------------------------------------------------------------------ المنتج

def build_brand_mark(brand, coll, height=1.35, depth=0.26):
    """رمز الهوية مجسّماً من أجزائه في brand.json"""
    vx, vy, vw, vh = brand["logo"]["mark"]["viewBox"]
    s = height / vh
    cx = vx + vw / 2
    bottom = vy + vh
    paper = hex_rgba(brand["colors"]["paper"])
    lime = hex_rgba(brand["colors"]["accent"])
    mat_base = material("MarkBase", paper, roughness=0.32, coat=0.2)
    mat_acc = material("MarkAccent", lime, roughness=0.3, emission=lime, emission_strength=0.35)
    parent = bpy.data.objects.new("Product", None)
    link(parent, coll)
    for i, part in enumerate(brand["logo"]["mark"]["parts"]):
        if part["type"] == "polygon":
            pts = [tuple(map(float, p.split(","))) for p in part["points"].split()]
        else:
            x, y, w = part["x"], part["y"], part["w"]
            h = part.get("h", w)
            pts = [(x, y), (x + w, y), (x + w, y + h), (x, y + h)]
        me = bpy.data.meshes.new(f"MarkPart{i}")
        bm = bmesh.new()
        vs = [bm.verts.new(((px - cx) * s, -depth / 2, (bottom - py) * s)) for px, py in pts]
        face = bm.faces.new(vs)
        ext = bmesh.ops.extrude_face_region(bm, geom=[face])
        moved = [v for v in ext["geom"] if isinstance(v, bmesh.types.BMVert)]
        bmesh.ops.translate(bm, vec=Vector((0, depth, 0)), verts=moved)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        bm.to_mesh(me)
        bm.free()
        obj = link(bpy.data.objects.new(f"Mark_{part['role']}_{i}", me), coll)
        bev = obj.modifiers.new("Bevel", "BEVEL")
        bev.width = 0.008
        bev.segments = 2
        bev.limit_method = "ANGLE"
        obj.data.materials.append(mat_base if part["role"] == "base" else mat_acc)
        obj.parent = parent
    return parent


def import_product(path, coll, max_size=1.4):
    ext = os.path.splitext(path)[1].lower()
    before = set(bpy.data.objects)
    if ext in (".glb", ".gltf"):
        bpy.ops.import_scene.gltf(filepath=path)
    elif ext == ".fbx":
        bpy.ops.import_scene.fbx(filepath=path)
    elif ext == ".obj":
        bpy.ops.wm.obj_import(filepath=path)
    else:
        raise SystemExit(f"ERROR: صيغة غير مدعومة: {ext}")
    new = [o for o in bpy.data.objects if o not in before]
    meshes = [o for o in new if o.type == "MESH"]
    if not meshes:
        raise SystemExit("ERROR: الملف لا يحتوي مجسمات")
    parent = bpy.data.objects.new("Product", None)
    link(parent, coll)
    for o in new:
        for c in o.users_collection:
            c.objects.unlink(o)
        coll.objects.link(o)
        if o.parent is None:
            o.parent = parent
    bpy.context.view_layer.update()
    pts = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
    mn = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    mx = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    size = max(mx - mn)
    k = max_size / size if size > 0 else 1.0
    parent.scale = (k, k, k)
    center = (mn + mx) / 2
    parent.location = (-center.x * k, -center.y * k, -mn.z * k)
    return parent


# ------------------------------------------------------------------ الإضاءة والكاميرات

def area_light(name, loc, energy, size, color, coll, spot=0.0):
    """spot > 0: ضوء بقعي بزاوية spot درجة (يتحكم بالتسرّب على الخلفية)"""
    data = bpy.data.lights.new(name, "SPOT" if spot else "AREA")
    data.energy = energy
    data.color = color
    if spot:
        data.spot_size = math.radians(spot)
        data.spot_blend = 0.6
        data.shadow_soft_size = size
    else:
        data.size = size
    obj = link(bpy.data.objects.new(name, data), coll)
    obj.location = loc
    direction = Vector((0, 0, TARGET_Z)) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    return obj


def build_lights(brand, coll):
    lime = hex_rgba(brand["colors"]["accent"])[:3]
    # إضاءة بقعية مضبوطة على المنتج حتى تبقى الخلفية داكنة (أسود عميق حسب الهوية)
    area_light("Key", (-4.0, -4.2, 5.0), 2600, 0.8, (1.0, 0.97, 0.93), coll, spot=34)
    area_light("RimWhite", (3.6, 3.2, 3.6), 1500, 0.5, (1.0, 1.0, 1.0), coll, spot=28)
    area_light("RimLime", (-3.8, 2.8, 2.2), 700, 0.5, lime, coll, spot=24)
    area_light("Fill", (0.5, -7.0, 1.8), 60, 5.0, (0.92, 0.95, 1.0), coll)


def camera(name, coll, target, lens=50):
    data = bpy.data.cameras.new(name)
    data.lens = lens
    data.sensor_fit = "AUTO"
    data["base_lens"] = lens
    obj = link(bpy.data.objects.new(name, data), coll)
    con = obj.constraints.new("TRACK_TO")
    con.target = target
    con.track_axis = "TRACK_NEGATIVE_Z"
    con.up_axis = "UP_Y"
    return obj


def key_path(obj, points, frames):
    """points: [(frame_fraction, (x, y, z))]"""
    for frac, loc in points:
        obj.location = loc
        obj.keyframe_insert("location", frame=1 + round(frac * (frames - 1)))


def build_cameras(coll, frames):
    target = bpy.data.objects.new("CamTarget", None)
    target.location = (0, 0, TARGET_Z)
    link(target, coll)

    push = camera("CAM_push", coll, target, lens=55)
    key_path(push, [(0.0, (0.0, -10.5, 2.6)), (1.0, (0.0, -6.2, 1.55))], frames)

    orbit = camera("CAM_orbit", coll, target, lens=50)
    pts = []
    for k in range(7):
        a = math.radians(-40 + 70 * k / 6)
        pts.append((k / 6, (7.2 * math.sin(a), -7.2 * math.cos(a), 1.7 + 0.25 * math.sin(k / 6 * math.pi))))
    key_path(orbit, pts, frames)

    top = camera("CAM_top", coll, target, lens=45)
    key_path(top, [(0.0, (0.0, -3.6, 8.6)), (0.55, (0.0, -5.6, 4.8)), (1.0, (0.0, -7.4, 2.3))], frames)

    # حركة ناعمة (ease in/out) لكل المفاتيح
    for cam in (push, orbit, top):
        if cam.animation_data and cam.animation_data.action:
            for fc in getattr(cam.animation_data.action, "fcurves", []):
                for kp in fc.keyframe_points:
                    kp.interpolation = "BEZIER"
                    kp.easing = "AUTO"
    bpy.context.scene.camera = push
    return target


def build_turntable(product, frames):
    tt = bpy.data.objects.new("Turntable", None)
    link(tt)
    tt.location = (0, 0, 0.4)
    product.parent = tt
    tt.rotation_euler = (0, 0, math.radians(-12))
    tt.keyframe_insert("rotation_euler", frame=1)
    tt.rotation_euler = (0, 0, math.radians(14))
    tt.keyframe_insert("rotation_euler", frame=frames)
    return tt


def main():
    args = parse_args()
    with open(args.brand, encoding="utf-8") as f:
        brand = json.load(f)
    scene = setup_scene(args.frames)
    setup_world(scene, brand)
    set_coll = new_collection("Set")
    prod_coll = new_collection("Product")
    rig = new_collection("Rig")
    build_cyclorama(brand, set_coll)
    build_pedestal(brand, set_coll)
    build_pixels(brand, set_coll, args.frames)
    if args.product:
        product = import_product(os.path.abspath(args.product), prod_coll)
    else:
        product = build_brand_mark(brand, prod_coll)
    build_turntable(product, args.frames)
    build_lights(brand, rig)
    build_cameras(rig, args.frames)
    scene["studio_frames"] = args.frames
    scene["studio_brand"] = brand.get("id", "")
    out = os.path.abspath(args.out)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=out)
    print("SCENE_SAVED", out)


if __name__ == "__main__":
    main()
