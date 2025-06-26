
import bpy

def clear_nla_tracks():
    for obj in bpy.data.objects:
        if obj.animation_data and obj.animation_data.nla_tracks:
            for track in obj.animation_data.nla_tracks:
                obj.animation_data.nla_tracks.remove(track)
    print("🧹 所有 NLA Tracks 和 Strips 已清除。")

clear_nla_tracks()

# 清除所有具有 shape key 的对象的动画关键帧
def clear_shape_key_keyframes():
    for obj in bpy.data.objects:
        if obj.type == 'MESH' and obj.data.shape_keys:
            if obj.data.shape_keys.animation_data:
                obj.data.shape_keys.animation_data_clear()
    print("🧹 所有 Shape Key 的动画关键帧已清除。")

clear_shape_key_keyframes()


# Select all mesh objects with shape keys
for obj in bpy.data.objects:
    if obj.type == 'MESH' and obj.data.shape_keys:
        obj.select_set(True)




# 表情定义：名称 + 对应的 Shape Key 列表
expressions = {
    "SmileIdle": ["MouthSmile_L", "MouthSmile_R"],
    "Blink": ["EyeBlink_L", "EyeBlink_R"],
    "FriendlySmile": ["MouthSmile_L", "MouthSmile_R", "CheekSquint_L", "CheekSquint_R"],
    "AwkwardSmile": ["MouthSmile_L", "MouthSmile_R", "BrowInnerUp"],
    "LoveExpression": ["MouthSmile_L", "MouthSmile_R", "EyeWide_L", "EyeWide_R"],
    "ApologizeFace": ["BrowInnerUp", "BrowDown_L", "BrowDown_R"],
    "LaughOpenMouth": ["MouthSmile_L", "MouthSmile_R", "MouthOpen", "CheekSquint_L", "CheekSquint_R"],
    "FocusLook": ["EyeLookUp_L", "EyeLookUp_R", "BrowsD_L", "BrowsD_R"],
    "PlayfulExpression": ["MouthPucker", "EyeWide_L", "EyeWide_R"],
}


# 动画帧设置
frame_start = 10
frame_peak = 20
frame_end = 40

# 查找所有有 shape keys 的对象
mesh_objs = [obj for obj in bpy.data.objects if obj.type == 'MESH' and obj.data.shape_keys]

for expr_name, keys in expressions.items():
    print(f"🎬 正在创建动作：{expr_name}")

    # 为每个对象设置一个动作
    for obj in mesh_objs:
        if all(k in obj.data.shape_keys.key_blocks for k in keys):

            # 创建新的动作
            action_name = f"{obj.name}_{expr_name}"
            action = bpy.data.actions.new(name=action_name)
            obj.data.shape_keys.animation_data_create()
            obj.data.shape_keys.animation_data.action = action

            # 插入关键帧
            for k in keys:
                kb = obj.data.shape_keys.key_blocks[k]

                # 初始帧：无表情
                kb.value = 0.0
                kb.keyframe_insert(data_path="value", frame=frame_start)

                # 表情峰值
                kb.value = 1.0
                kb.keyframe_insert(data_path="value", frame=frame_peak)

                # 回归无表情
                kb.value = 0.0
                kb.keyframe_insert(data_path="value", frame=frame_end)

            # 推送到 NLA
            nla = obj.data.shape_keys.animation_data.nla_tracks.new()
            strip = nla.strips.new(name=action_name, start=frame_start, action=action)

print("✅ 所有表情动作已生成并添加到 NLA。")


# 动作定义
actions = {
    "HandsFoldedIdle": ["DEF-upper_arm.L", "DEF-upper_arm.R", "DEF-forearm.L", "DEF-forearm.R", "DEF-spine"],
    "WaveHello": ["DEF-upper_arm.R", "DEF-forearm.R", "DEF-hand.R", "DEF-spine"],
    "ScratchHead": ["DEF-upper_arm.R", "DEF-forearm.R", "DEF-hand.R", "DEF-spine"],
    "HeartGesture": ["DEF-upper_arm.L", "DEF-upper_arm.R", "DEF-forearm.L", "DEF-forearm.R", "DEF-spine"],
    "BowThanks": ["DEF-spine", "DEF-spine.001", "DEF-head"],
    "WaveGoodbye": ["DEF-forearm.R", "DEF-hand.R"],
    "PointRight": ["DEF-upper_arm.R", "DEF-forearm.R"],
    "PalmUp": ["DEF-forearm.R", "DEF-hand.R"],
    "EmphasizePoint": ["DEF-upper_arm.L", "DEF-upper_arm.R", "DEF-spine"],
    "ApologizeChest": ["DEF-upper_arm.L", "DEF-upper_arm.R", "DEF-forearm.L", "DEF-forearm.R"],
    "HandsSpreadCompare": ["DEF-upper_arm.L", "DEF-upper_arm.R"],
    "Clap": ["DEF-upper_arm.L", "DEF-upper_arm.R", "DEF-forearm.L", "DEF-forearm.R"]
}

# Automatically select the required armature and mesh objects
for obj in bpy.data.objects:
    obj.select_set(False)

# Try to select Armature
armature = None
for obj in bpy.data.objects:
    if obj.type == 'ARMATURE':
        armature = obj
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        break


# 设置帧长度
frame_count = 40

# 基于 Rest Pose 初始化
bpy.ops.object.mode_set(mode='POSE')
armature = bpy.context.object

# 创建每个动作
for action_name, bone_names in actions.items():
    action = bpy.data.actions.new(name=action_name)
    armature.animation_data_create()
    armature.animation_data.action = action

    for bone_name in bone_names:
        if bone_name not in armature.pose.bones:
            print(f"⚠️ 骨骼不存在: {bone_name}")
            continue
        pbone = armature.pose.bones[bone_name]
        pbone.rotation_mode = 'QUATERNION'

        # 插入多个自然关键帧
        for f in [1, 10, 20, 30, 40]:
            angle_y = random.uniform(-0.15, 0.15) if "spine" in bone_name else random.uniform(-0.35, 0.35)
            angle_z = random.uniform(-0.15, 0.15) if "spine" in bone_name else random.uniform(-0.25, 0.25)
            pbone.rotation_quaternion = (1.0, 0.0, angle_y, angle_z)
            pbone.keyframe_insert(data_path="rotation_quaternion", frame=f)

    # Push 到 NLA
    bpy.ops.nla.bake(frame_start=1, frame_end=frame_count, only_selected=False, visual_keying=True,
                     clear_constraints=False, use_current_action=True, bake_types={'POSE'})

    track = armature.animation_data.nla_tracks.new()
    strip = track.strips.new(name=action_name, start=1, action=action)
    strip.action_frame_start = 1
    strip.action_frame_end = frame_count
    strip.repeat = 1
    strip.blend_type = 'REPLACE'
    strip.use_sync_length = True
    strip.use_auto_blend = False
    strip.extrapolation = 'CYCLIC'  # 设置循环

print("✅ 所有动作已生成并添加到 NLA！")

