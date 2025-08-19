import bpy import random

# 🧹 清除所有 NLA Tracks 和 ShapeKey 动画关键帧

def clear_nla_tracks(): for obj in bpy.data.objects: if obj.animation_data and
obj.animation_data.nla_tracks: for track in obj.animation_data.nla_tracks:
obj.animation_data.nla_tracks.remove(track) print("🧹 所有 NLA
Tracks 和 Strips 已清除。")

clear_nla_tracks()

# 清除所有具有 shape key 的对象的动画关键帧

def clear_shape_key_keyframes(): for obj in bpy.data.objects: if obj.type ==
'MESH' and obj.data.shape_keys: if obj.data.shape_keys.animation_data:
obj.data.shape_keys.animation_data_clear() print("🧹 所有 Shape
Key 的动画关键帧已清除。")

clear_shape_key_keyframes()

# ✅ 表情定义：名称 + ShapeKey 列表

expressions = { "SmileIdle": ["MouthSmile_L", "MouthSmile_R"], "Blink":
["Eye_Blink_L", "Eye_Blink_R"], "FriendlySmile": ["MouthSmile_L",
"MouthSmile_R", "Cheek_Raise_L", "Cheek_Raise_R"], "AwkwardSmile":
["MouthSmile_L", "MouthSmile_R", "Brow_Raise_Inner_L", "Brow_Raise_Inner_R"],
"LoveExpression": ["MouthSmile_L", "MouthSmile_R", "Eye_Wide_L", "Eye_Wide_R"],
"ApologizeFace": ["Brow_Raise_Inner_L", "Brow_Raise_Inner_R", "Brow_Drop_L",
"Brow_Drop_R"], "LaughOpenMouth": ["MouthSmile_L", "MouthSmile_R", "Jaw_Open",
"Cheek_Raise_L", "Cheek_Raise_R"], "FocusLook": ["Eye_L_Look_Up",
"Eye_R_Look_Up", "Brow_Compress_L", "Brow_Compress_R"], "PlayfulExpression":
["Mouth_Pucker_Up_L", "Mouth_Pucker_Up_R", "Eye_Wide_L", "Eye_Wide_R"] }

frame_start = 10 frame_peak = 20 frame_end = 40

mesh_objs = [obj for obj in bpy.data.objects if obj.type == 'MESH' and
obj.data.shape_keys]

for expr*name, keys in expressions.items():
print(f"🎬 正在创建动作：{expr_name}") for obj in mesh_objs: if all(k in
obj.data.shape_keys.key_blocks for k in keys): action_name =
f"{obj.name}*{expr_name}" action = bpy.data.actions.new(name=action_name)
obj.data.shape_keys.animation_data_create()
obj.data.shape_keys.animation_data.action = action

            for k in keys:
                kb = obj.data.shape_keys.key_blocks[k]
                for f, v in [(frame_start, 0.0), (frame_peak, 1.0), (frame_end, 0.0)]:
                    kb.value = v
                    kb.keyframe_insert(data_path="value", frame=f)

            nla = obj.data.shape_keys.animation_data.nla_tracks.new()
            strip = nla.strips.new(name=action_name, start=frame_start, action=action)
            strip.action_frame_start = frame_start
            strip.action_frame_end = frame_end
            strip.extrapolation = 'HOLD_FORWARD'
            strip.repeat = 1

print("✅ 所有表情动作已生成并添加到 NLA。")

# ✅ 动作定义：已使用实际存在的 DEF-\* 骨骼名

actions = { "HandsFoldedIdle": [ "DEF-upper_arm.L", "DEF-upper_arm.R",
"DEF-forearm.L", "DEF-forearm.R", "DEF-spine.001", "DEF-spine.002" ],
"WaveHello": [ "DEF-upper_arm.R", "DEF-forearm.R", "DEF-hand.R", "DEF-spine.002"
], "ScratchHead": [ "DEF-upper_arm.R", "DEF-forearm.R", "DEF-hand.R",
"DEF-spine.003" ], "HeartGesture": [ "DEF-upper_arm.L", "DEF-upper_arm.R",
"DEF-forearm.L", "DEF-forearm.R", "DEF-spine.002", "DEF-spine.003" ],
"BowThanks": [ "DEF-spine.001", "DEF-spine.002", "DEF-spine.003",
"DEF-spine.004" ], "WaveGoodbye": [ "DEF-forearm.R", "DEF-hand.R" ],
"PointRight": [ "DEF-upper_arm.R", "DEF-forearm.R" ], "PalmUp": [
"DEF-forearm.R", "DEF-hand.R" ], "EmphasizePoint": [ "DEF-upper_arm.L",
"DEF-upper_arm.R", "DEF-spine.003", "DEF-spine.004" ], "ApologizeChest": [
"DEF-upper_arm.L", "DEF-upper_arm.R", "DEF-forearm.L", "DEF-forearm.R" ],
"HandsSpreadCompare": [ "DEF-upper_arm.L", "DEF-upper_arm.R" ], "Clap": [
"DEF-upper_arm.L", "DEF-upper_arm.R", "DEF-forearm.L", "DEF-forearm.R" ] }

# 🛠 确保在 Object 模式下进行选择

if bpy.ops.object.mode_set.poll(): bpy.ops.object.mode_set(mode='OBJECT')

# 🧹 清除所有选择

bpy.ops.object.select_all(action='DESELECT')

# ✅ 选中并激活目标 Armature

armature = bpy.data.objects["blender file_Rigify"] armature.select_set(True)
bpy.context.view_layer.objects.active = armature

# 验证

if armature is None: print("⚠️ 没有找到 Armature！") else:
print(f"🎯 使用 Armature：{armature.name}")

bpy.ops.object.mode_set(mode='POSE')

if armature: bpy.context.view_layer.objects.active = armature
bpy.ops.object.mode_set(mode='POSE')

    for action_name, bone_names in actions.items():
        print(f"🎬 正在创建动作：{action_name}")
        action = bpy.data.actions.new(name=action_name)
        armature.animation_data_create()
        armature.animation_data.action = action

        for bone_name in bone_names:
            if bone_name not in armature.pose.bones:
                print(f"⚠️ 骨骼不存在: {bone_name}")
                continue
            pbone = armature.pose.bones[bone_name]
            pbone.rotation_mode = 'QUATERNION'
            for f in [1, 10, 20, 30, 40]:
                angle_y = random.uniform(-0.2, 0.2)
                angle_z = random.uniform(-0.2, 0.2)
                pbone.rotation_quaternion = (1.0, 0.0, angle_y, angle_z)
                pbone.keyframe_insert(data_path="rotation_quaternion", frame=f)

        # bake and push to NLA
        bpy.ops.nla.bake(frame_start=1, frame_end=40, only_selected=False, visual_keying=True,
                         clear_constraints=False, use_current_action=True, bake_types={'POSE'})

        track = armature.animation_data.nla_tracks.new()
        strip = track.strips.new(name=action_name, start=1, action=action)
        strip.action_frame_start = 1
        strip.action_frame_end = 40
        strip.repeat = 1
        strip.blend_type = 'REPLACE'
        strip.use_auto_blend = False
        strip.use_sync_length = True
        strip.extrapolation = 'HOLD_FORWARD'

    print("✅ 所有骨骼动作已生成并添加到 NLA。")

else: print("⚠️ 没有找到 Armature！")
