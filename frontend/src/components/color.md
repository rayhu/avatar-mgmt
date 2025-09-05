完全能理解这个担心。要把「Blender/FBX → Unity → GLB →
three.js」一路的视觉漂移压到最小，你可以把这当成一条“锁参管线”，从资产→导出→渲染三端同时约束。下面给你一份可执行的稳定性方案（含给美术/TA的交付清单、导出参数、前端核查脚本、常见踩坑对照）。

⸻

0. 一句话策略• 同一套 PBR 假设：线性工作流 +
   sRGB 贴图解码 + 金属度/粗糙度（Metal/Rough）工作流。• 同一套环境：统一 IBL（同一张 HDRI/同一组 Sky 参数）、同一主/补光数值、同一 FOV/曝光/色调映射。• 同一套贴图打包规则：glTF 的 ORM（Occlusion-Roughness-Metallic）通道顺序。• 禁止隐式后处理：Unity 端关闭 Bloom/ToneMapping 或把参数写进文档，你前端对应起来。

⸻

1. 让美术交付什么（“稳定交付清单”）

发给设计师的“打包清单”，谁拿谁稳：1. 模型与动画• _.glb（首选）或
_.fbx（仅作为源）：• 勾选 Shape Keys / BlendShapes
• 勾选 Animations（骨骼 & 形变关键帧）• 统一单位 Meters，上轴 Y-up，坐标系 右手系 2. 贴图（单独提供原图，一律 PNG/EXR/HDR）•
BaseColor（sRGB）•
Normal（线性，注明 Y 轴方向：OpenGL=+Y；如来自 Unity 可能是 DirectX，需要翻转）•
ORM（线性，R: AO / G: Roughness / B:
Metallic）• 若他们目前是 Unity 的 Metallic(R)+Smoothness(A)，请同时给：•
metallic.png（线性，R）• smoothness.png（线性，A），并说明：Roughness = 1 -
Smoothness（前端会合成到 G 通道）3. 光照与相机（数字化）• 主光：类型（Directional）、颜色（#RRGGBB）、强度、位置/旋转（欧拉/四元数）、阴影参数（分辨率/偏移）• 补光：同上• 环境：HDRI 文件或Sky 参数（Rayleigh、Mie、Sun 角度）• 相机：FOV/近远截面/位置/旋转 4. 后处理• 是否启用 ToneMapping
/ Bloom /
ColorAdjust；如启用给出算法与参数（Unity曲线/ACES等）• 理想情况：Unity 端禁用，把映射交给 three.js（用 ACES/Neutral 对齐）

你已经有了 JSON（相机/灯光/Skybox=Default-Skybox），非常好。缺的通常就是贴图通道说明和HDRI 或 Sky 参数。

⸻

2. 导出设置（Blender & Unity）

Blender → glTF (.glb)：• 勾选：+ Include → UVs / Normals / Tangents / Vertex
Colors / Skinning / Shape Keys / Animations • Materials: PBR Metallic-Roughness
• Images:
PNG（或 KTX2 由你们后端做）• 如果有 Smoothness 贴图：请在 DCC 就转换为 Roughness或把 Smoothness 单独导出并备注“R=AO/G=Roughness/B=Metallic”的打包方式。

Unity → glTF：• 选择 Linear 色彩空间• 导出器选项：Export BlendShapes、Export
Animations、Export Materials
• 不要烘焙 Unity 的后处理（Bloom/ToneMapping），除非同时提供参数让前端复刻。

⸻

3. three.js 端的“落地兜底”

你当前文件已具备：sRGB/ACES/IBL/灯光/相机。再加两点兜底即可：

(a) 正确处理 ORM 与法线

如果对方提供的是 Metallic + Smoothness(A)，在加载后一次性合成 ORM（示例逻辑）：

// 伪代码思路：用离线脚本或构建时处理更好，运行时也可 // Roughness = 1 -
SmoothnessA；然后 pack 到 RGB → ORM

最佳是让美术直接交已打好的 ORM。否则你得写个小工具把 metallic/ao/roughness 打进 R/G/B。

法线：如果来自 Unity 的 DirectX 法线（-Y），需要：

material.normalScale.set(1, -1); // 或者在贴图导出时转换到 OpenGL(+Y)

(b) 统一强度与映射• renderer.toneMapping =
ACESFilmicToneMapping（或 Neutral，对齐 Unity）•
renderer.toneMappingExposure：0.95~1.10 小步微调•
scene.environment：同一张 HDRI或同一组 Sky 参数•
envMapIntensity：0.6~1.0，金属太“亮”就降•
dirLight.bias/normalBias：避免脏影（你已有）

⸻

4. 验证用“金/灰双球 + LUT”快速对表

在 three.js 场景里暂时加两颗球：• Chrome（metal=1,
rough=0.05） → 看 IBL 强弱与色偏• Gray（metal=0,
rough=0.6，纯 18% 灰） → 看整体曝光与色调

const chrome = new THREE.Mesh( new THREE.SphereGeometry(0.12, 64, 32), new
THREE.MeshStandardMaterial({ metalness: 1, roughness: 0.05 }) );
chrome.position.set(-0.25, 1.4, 0);

const gray = new THREE.Mesh( new THREE.SphereGeometry(0.12, 64, 32), new
THREE.MeshStandardMaterial({ color: 0xB3B3B3, metalness: 0, roughness: 0.6 }) );
gray.position.set(0.25, 1.4, 0);

scene.add(chrome, gray);

对齐流程（1 分钟）：1. 用球看 IBL 是否“过电”
→ 调 envMapIntensity。2. 用灰球看曝光是否一致 → 调 toneMappingExposure。3. 看主光阴影硬度/方向 → 调 Directional 的强度/方向。

⸻

5. 常见“色差/亮度/反射”问题对照

现象 根因 解决金属“过亮、偏色” HDRI 室内色染强 /
envMapIntensity 高 换中性 HDRI 或 Sky；envMapIntensity 降到 0.6~0.9 整体发青/发绿 Ambient/补光带偏色 +
ACES 白点差 Ambient 改中性灰；补光用淡蓝 #EAF2FF；必要时 NeutralToneMapping 去掉 HDR 后“脸发黑” 没有环境漫反射 加 HemisphereLight(sky≈淡蓝,
ground≈灰, 0.5~0.6) 粗糙度/金属与 Unity 相反 Smoothness vs
Roughness 反向 roughness = 1 - smoothness；统一 ORM 打包法线“鼓包方向错”
DirectX(-Y) vs OpenGL(+Y) normalScale.set(1,-1) 或转换贴图 AO 没效果 缺 uv2
geometry.setAttribute('uv2',
geometry.attributes.uv)（兜底）动画丢了 导出没勾 Animations 重新导出，确认 gltf.animations.length>0 表情没反应 没勾 Shape
Keys / BlendShapes 重新导出；three.js 检查 morphTargetDictionary

⸻

6. 你现在就能用的小工具（打印清单）

把它加在模型加入场景后，立刻知道动画片段和每个网格的 morph 名，用于对齐命名：

// 动画清单 console.table(availableAnimations.map(c => ({ name: c.name, dur:
c.duration.toFixed(2), tracks: c.tracks.length })));

// 表情清单 model.traverse((o:any) => { if ((o.isMesh||o.isSkinnedMesh) &&
o.morphTargetDictionary) { console.log('🎭', o.name,
Object.keys(o.morphTargetDictionary)); } });

⸻

7. 如果必须走 FBX

尽量把 可变的渲染因素留在 glTF 阶段对齐：• 先在 Unity 内把 FBX →
Prefab 调好（单位、骨骼、法线方向、材质工作流、BlendShapes）。• 再 Unity →
glTF，并把上面的交付清单（光照/相机/环境/后处理）一并导出为 JSON/文字。• 你前端永远以 glTF 的约定（ORM/Metal-Rough/Linear+ACES）为准。

⸻

如果你愿意，我可以基于你们的真实贴图命名（比如
_\_metallic.png/_\_smoothness.png）写一个构建期的小脚本，自动把 AO/Rough/Metal 打成 ORM，顺便检测法线 Y 通道方向，这样就不会在运行时再猜“为什么反了”。
