import bpy



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

print("✅ 所有表情动作已生成并添加到 NLA，准备导出 GLB。")