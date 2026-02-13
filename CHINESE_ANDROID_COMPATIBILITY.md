# Chinese Android Phone Compatibility Guide

## Overview

Chinese Android manufacturers (Huawei, Xiaomi, OPPO, Vivo, etc.) implement aggressive battery optimization and permission management systems that can affect PWA functionality and microphone access. This guide provides specific instructions for each manufacturer.

## Common Issues

1. **Microphone permission denied** - Even after granting permission
2. **App killed in background** - System automatically closes the app
3. **No audio input** - Microphone access blocked by system
4. **App stops working after screen lock** - Background restrictions

## Manufacturer-Specific Solutions

### 🔶 Huawei / Honor (华为 / 荣耀)

**EMUI / HarmonyOS Specific Issues:**
- Strict background app management
- Additional permission layers
- Aggressive battery optimization

**Microphone Permission:**
```
设置 → 应用和服务 → 权限管理 → 麦克风
找到 Chrome 或 语音字幕 → 允许
```

**Background Activity (Critical!):**
```
设置 → 电池 → 应用启动管理
找到应用 → 关闭「自动管理」
手动开启：
  ✓ 允许后台活动
  ✓ 允许自启动
  ✓ 允许关联启动
```

**Additional Settings:**
```
设置 → 应用和服务 → 应用管理 → 找到应用
→ 电池 → 应用启动管理 → 手动管理
→ 通知 → 允许通知（可选，用于状态提示）
```

**If Still Not Working:**
- Check "Protected Apps" (受保护应用) - Add the app
- Disable "Power Genie" (省电精灵) for this app
- In Developer Options: Disable "Don't keep activities"

---

### 🔶 Xiaomi / Redmi / POCO (小米 / 红米)

**MIUI Specific Issues:**
- Very aggressive background killing
- Multiple permission layers
- Battery saver kills apps quickly

**Microphone Permission:**
```
设置 → 应用设置 → 应用管理
找到 Chrome 或 语音字幕
→ 权限管理 → 麦克风 → 允许
```

**Battery Optimization (Essential!):**
```
应用详情页面：
→ 省电策略 → 无限制
→ 自启动 → 允许
→ 后台弹出界面 → 允许
```

**Special Permissions:**
```
设置 → 隐私保护 → 特殊权限
→ 后台弹出界面 → 找到应用 → 允许
→ 显示悬浮窗 → 找到应用 → 允许
→ 锁屏显示 → 允许（可选）
```

**Battery Saver:**
```
设置 → 电池与性能 → 省电模式
→ 应用智能省电 → 找到应用 → 无限制
```

**MIUI Optimization:**
```
设置 → 应用设置 → 应用管理 → 找到应用
→ 其他权限 → 后台运行 → 允许
```

**If Still Not Working:**
- Disable "MIUI Optimization" in Developer Options
- Add app to "Memory Extension" whitelist
- Check "Battery Saver" is not in Ultra mode

---

### 🔶 OPPO / Realme (OPPO / 真我)

**ColorOS Specific Issues:**
- Background freeze system
- Smart power saving

**Microphone Permission:**
```
设置 → 应用管理 → 找到应用
→ 权限 → 麦克风 → 允许
```

**Background Management:**
```
应用详情页面：
→ 电池 → 后台冻结 → 允许后台运行
→ 应用自启动 → 允许
```

**Power Saving:**
```
设置 → 电池 → 省电模式
→ 应用耗电管理 → 找到应用 → 允许后台运行
```

---

### 🔶 Vivo / iQOO (维沃)

**Funtouch OS / Origin OS Issues:**
- Background high power consumption management
- Strict permission control

**Microphone Permission:**
```
设置 → 应用与权限 → 权限管理
→ 麦克风 → 找到应用 → 允许
```

**Background Management:**
```
设置 → 电池 → 后台高耗电
→ 找到应用 → 允许后台高耗电
```

**Auto-start:**
```
i管家 → 应用管理 → 自启动管理
→ 找到应用 → 允许自启动
```

---

## General Troubleshooting Steps

### Step 1: Basic Permission Check
1. Open app settings
2. Check microphone permission is "Allow" not "Ask every time"
3. Ensure no other apps are using microphone

### Step 2: Battery Optimization
1. Find app in battery settings
2. Set to "No restrictions" or "Unrestricted"
3. Disable any "Adaptive battery" for this app

### Step 3: Background Activity
1. Enable "Background activity"
2. Enable "Auto-start"
3. Disable "Battery optimization"

### Step 4: System Settings
1. Disable "Battery Saver" mode (or whitelist app)
2. Check "Developer Options" - disable "Don't keep activities"
3. Restart phone after changing settings

### Step 5: App-Specific
1. Clear app cache (if PWA)
2. Clear browser cache (if using browser)
3. Reinstall PWA or clear browser data

## Testing Checklist

After configuring permissions, test:

- [ ] Microphone permission granted
- [ ] App doesn't close when screen locks
- [ ] App continues working in background
- [ ] Audio input is captured correctly
- [ ] App survives phone restart
- [ ] Works after battery saver enabled
- [ ] No "app stopped" notifications

## Quick Reference Table

| Manufacturer | Key Setting Location | Critical Permission |
|--------------|---------------------|---------------------|
| Huawei/Honor | 电池 → 应用启动管理 | 允许后台活动 |
| Xiaomi/Redmi | 省电策略 → 无限制 | 后台弹出界面 |
| OPPO/Realme | 电池 → 后台冻结 | 允许后台运行 |
| Vivo/iQOO | 后台高耗电 | 允许后台高耗电 |

## Developer Notes

### Why These Issues Occur

Chinese Android manufacturers implement custom Android skins with:

1. **Aggressive Battery Management**: Apps are killed to save battery
2. **Permission Layers**: Multiple permission systems (Android + Custom)
3. **Background Restrictions**: Apps can't run freely in background
4. **Memory Management**: Apps cleared from memory aggressively

### Technical Considerations

1. **Wake Locks**: May not work reliably on these devices
2. **Background Services**: Often killed despite permissions
3. **Foreground Services**: More reliable but require notification
4. **PWA Limitations**: Treated as regular apps, subject to same restrictions

### Recommendations for Users

1. **Use Browser Mode**: Sometimes more reliable than PWA
2. **Keep Screen On**: Use screen timeout settings
3. **Disable Battery Saver**: When using the app
4. **Regular Permissions Check**: Settings may reset after updates

## Support Resources

- Huawei: https://consumer.huawei.com/en/support/
- Xiaomi: https://www.mi.com/global/support/
- OPPO: https://support.oppo.com/
- Vivo: https://www.vivo.com/support

## Updates

This guide is based on:
- EMUI 12 / HarmonyOS 3
- MIUI 14
- ColorOS 13
- Funtouch OS 13

Settings may vary by version. Always check manufacturer documentation for your specific device.
