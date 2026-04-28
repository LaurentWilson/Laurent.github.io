>**动机**
>
>想在CS2的集锦中添加动态模煳，首先是剪映，貌似是通过算法计算出的动态模煳，效果实在不能入眼（在CS这类FPS的游戏画面中），画面扭曲，HUB震动，因此只能另谋他法。


## 高帧率采样
1. **实现原理**：多帧合一 (Frame Blending)
2. **优点**：这种模糊是**真实模糊**，它基于物理位移产生，绝对不会导致 UI 扭曲或画面撕裂，效果极其细腻
3. **工具**：**FFmpeg** 或 **AviSynth**（或者更现代的 **SmoothVideo Project** 相关工具）

以下我将运用 **FFmpeg** 进行高帧率采样。

## 使用 FFmpeg 进行高帧率采样


### 步骤一：安装 FFmpeg
确保你已经安装了 FFmpeg 并且将其添加到了系统环境变量中。你可以打开终端输入 `ffmpeg -version` 来验证。

若未安装可到 [ffmpeg官网](https://www.ffmpeg.org/) 进行下载安装。


### 步骤二：编写 .bat 文件
>*什么是 Batch*
>
>Batch 最早源于 MS-DOS 时代，是一种专门为 Windows 命令行（CMD）设计的脚本语言，本质是命令行的集合，其特点是启动速度极快、兼容性极强（Windows 10/11 依然支持），文件后缀为 .bat 。

建立`Resampled.bat`：
1. 在桌面新建一个文本文档（.txt）
2. 将下面的代码复制进去
3. 保存后，将后缀名从 `.txt` 修改为 **`.bat`**

经数次迭代后，最终我的`Resampled.bat`文件如下：

```batch
@echo off
setlocal enabledelayedexpansion

:: ==========================================
:: CS Collection High Frame Rate Sampling Script
:: ==========================================

:: Set your target output directory
set "outputDir=OUTPUT DIRECTORY"

:: Set your target output frame rate
set OUT_FPS=60

:: Blending frames (Calculation: Recording FPS / Target FPS)
:: Example: 300fps recording / 60fps output = 5
set BLEND_FRAMES=5

:: Quality setting for HEVC NVENC (lower is better, 18-22 is great)
set "QUALITY=18"

:: Ensure the output directory exists
if not exist "%outputDir%" mkdir "%outputDir%"

echo Processing... Please wait...
echo Output Directory: %outputDir%
echo ------------------------------------------

:loop
if "%~1"=="" goto end

set "input=%~1"
set "output=%outputDir%\%~n1_resampled.mp4"

echo processing: "%~nx1"
echo Sampling mode: %BLEND_FRAMES% frames to 1 -> %OUT_FPS% fps @ HEVC

:: Set FFmpeg (Core Instruction)
ffmpeg -i "%input%" -vf "tmix=frames=%BLEND_FRAMES%:weights='1 2 3 4 5',fps=%OUT_FPS%,format=yuv420p" -c:v hevc_nvenc -rc vbr -cq %QUALITY% -preset p6 -tune hq -b_ref_mode middle -c:a copy -y "%output%"

if !errorlevel! equ 0 (
    echo Success: "%~n1_resampled.mp4" saved to Resampled folder.
) else (
    echo Error: Failed to process "%~nx1".
)

echo ------------------------------------------
shift
goto loop

:end
echo.
echo ==========================================
echo All tasks have been completed! Press any key to exit.

pause >nul
```

#### 参数详解：
- **`OUT_FPS=60`**: 告诉 FFmpeg 最终输出的帧率
- **`if not exist`**： 添加了 `if not exist` 检查，以便在尚未创建文件夹时自动创建该文件夹
- **`tmix=frames=5`**: 这是关键。因为 $300 / 60 = 5$，所以我们将每 5 帧合并成 1 帧。`tmix`（Temporal Mix）滤镜可以将连续的几帧按权重叠加。如果你录的是 $240fps$，这里就改成 $4$
- **`weights='1 1 1 1 1'`**: 给这 5 帧分配权重。全为 1 表示平均分配，生成的模糊最均匀。如果你想让模糊带一点“拖尾”效果，可以尝试前面的权重小，最后的权重大，比如把脚本里的 `weights='1'` 改成 `weights='1 2 3 4 5'`（假设是 5 帧），这样最后一帧最清晰，前面的帧呈淡出的残影状
- **`-rc vbr -cq %QUALITY%`**: 控制 NVENC 画质。数字越小画质越高（推荐 `%QUALITY%` 数值在18-22）


### 步骤三：`Resampled.bat`的使用
把高帧率视频文件拖到 `Resampled.bat` 中（可多选高帧率视频文件）。


### 进阶玩法：模仿快门角度（更真实）
如果你觉得上面的模糊太“重”了，想让它看起来更像电影摄像机（保留一定的清晰度），你可以通过调整 `tmix` 的帧数来实现类似于“快门角度”的效果。

- **全模糊（360°快门）**：`tmix=frames=5`（5 帧全参与合成，背景最顺滑）。
    
- **半模糊（180°快门）**：`tmix=frames=3`（只取其中 3 帧合成，背景会稍微清晰一点，更接近电影感）。


## 关于 Batch 语言的小课堂

### %~dpn1, %~n1, %~nx1
|**语法**|**含义**|**示例输出**|**适用场景**|
|---|---|---|---|
|**`%~n1`**|仅提取**文件名**（不含扩展名）|`ace`|当你只想修改后缀或改变保存文件夹时使用。|
|**`%~nx1`**|提取**文件名 + 扩展名**|`ace.mp4`|常用于日志输出（`echo Processing ace.mp4`）。|
|**`%~dpn1`**|提取**驱动器 + 路径 + 文件名**|`E:\Videos\CS_Clips\ace`|当你想在原文件夹下生成一个同名但不同格式的文件时使用。|

**拆解逻辑：**
- **`d`** (Drive): 盘符（E:）
    
- **`p`** (Path): 路径（\Videos\CS_Clips\）
    
- **`n`** (Name): 文件名（ace）  
    **`n`** (名称): 文件名（ace）
    
- **`x`** (eXtension): 扩展名（.mp4）

### `pause` 与 `pause >nul`

**`pause`**
- **表现**：屏幕上会显示一行文字：`请按任意键继续. . .` (英文环境显示 `Press any key to continue . . .`)。
    
- **用途**：提示用户任务已结束，确认后关闭窗口。
    

**`pause >nul`**
- **表现**：**完全静默**。屏幕上不会出现任何文字，窗口只是静止在那里，直到你按下键盘。
    
- **原理**：`>nul` 是将命令的标准输出重定向到“空设备”（Nul device），相当于把提示语“扔进了黑洞”。
    
- **用途**：通常配合自定义的 `echo` 使用。例如：
    
    代码段
    
    ```
    echo Task Done! Click any key to exit.
    pause >nul
    ```
    
    这样做可以让界面看起来更干净、更专业。

### 其他语法
- **`@echo off`**：告诉电脑：“只显示执行结果，别把我写的代码一行行复读出来”。
    
- **`setlocal enabledelayedexpansion`**：这是开启“变量延迟”，允许在循环中动态更新变量（比如你的计数器）。
    
- **`%%i` 或 `%%P`**：这是 `for` 循环特有的变量写法（在命令行里只需要一个 `%`，但在脚本里必须写两个 `%%`）。
    
- **`:` 后缀 (如 `:loop`)**：这叫 **标签 (Label)**，用来标记代码段，配合 `goto` 或 `call` 实现循环和跳转。