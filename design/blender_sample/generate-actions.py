import bpy
import math
import random

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
