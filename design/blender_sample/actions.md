import bpy

text = bpy.data.texts["combined_generate_all.py"]
exec(text.as_string())


基于骨骼清单 和所需的动作列表，为每个动作分配关键骨骼。
这些骨骼将用于插入关键帧，制作动作动画。以下是每个动作所需的关键骨骼草案列表

⸻

🧍‍♂️ HandsFoldedIdle（双手交叉静止）

涉及骨骼：
	•	DEF-upper_arm.L, DEF-forearm.L, DEF-hand.L
	•	DEF-upper_arm.R, DEF-forearm.R, DEF-hand.R
	•	DEF-spine.003（略微向前）
	•	手指关节（可选，用于自然交叠）

⸻

👋 WaveHello（挥手问候）

涉及骨骼：
	•	DEF-upper_arm.R, DEF-forearm.R, DEF-hand.R
	•	DEF-f_index.01.R ~ DEF-f_pinky.03.R（轻微展开）
	•	DEF-spine.003（稍微转向右侧）

⸻

🤔 ScratchHead（挠头）

涉及骨骼：
	•	DEF-upper_arm.R, DEF-forearm.R, DEF-hand.R
	•	DEF-spine.003（轻微前倾或向右歪头）

⸻

❤️ HeartGesture（比心）

涉及骨骼：
	•	DEF-forearm.L, DEF-forearm.R, DEF-hand.L, DEF-hand.R
	•	DEF-thumb.01.L, DEF-thumb.01.R
	•	DEF-f_index.01.L, DEF-f_index.01.R

⸻

🙇 BowThanks（鞠躬感谢）

涉及骨骼：
	•	DEF-spine.001 ~ DEF-spine.004（前倾）
	•	head（低头）
	•	DEF-upper_arm.L, DEF-upper_arm.R（自然下垂）

⸻

👋 WaveGoodbye（再见挥手）

与 WaveHello 相似，区别在于动作频率和幅度较小或侧向。

⸻

👉 PointRight（右指）

涉及骨骼：
	•	DEF-arm.R, DEF-forearm.R, DEF-hand.R
	•	DEF-f_index.01.R（完全伸直）
	•	其余手指收起

⸻

✋ PalmUp（手掌向上）

涉及骨骼：
	•	DEF-hand.R（旋转掌心向上）
	•	DEF-forearm.R

⸻

☝️ EmphasizePoint（强调手势）

涉及骨骼：
	•	DEF-hand.R, DEF-f_index.01.R（手指向上或伸出）
	•	DEF-spine.003（轻微带动）

⸻

🙏 ApologizeChest（手搭胸前）

涉及骨骼：
	•	DEF-hand.R, DEF-hand.L
	•	DEF-forearm.L, DEF-forearm.R
	•	DEF-chest

⸻

🤲 HandsSpreadCompare（双手摊开对比）

涉及骨骼：
	•	DEF-hand.L, DEF-hand.R
	•	DEF-forearm.L, DEF-forearm.R
	•	DEF-upper_arm.L, DEF-upper_arm.R
	•	DEF-spine.003（稍微挺胸）

⸻

👏 Clap（鼓掌）

涉及骨骼：
	•	DEF-hand.L, DEF-hand.R
	•	DEF-forearm.L, DEF-forearm.R
	•	可在关键帧间插入“靠近-分开”动画节奏


下一步

	1.	动作时长是否为固定帧数？例如每个动作为 40 帧。
	2.	是否每个动作单独一个 Action？是否所有动作都放入 NLA？
	3.	是否需要 loop（循环）设置？（例如：idle 动作）
	4.	需要我随机插入多个关键帧形成自然过渡，还是只在首尾插入？
	5.	是否只用 DEF-* 骨骼动画？是否要避免修改控制骨骼（如 MCH-*）？

