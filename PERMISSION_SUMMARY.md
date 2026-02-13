# Permission Summary - Chinese Android Phones

## Quick Fix Guide

### 华为 / 荣耀 (Huawei / Honor)
**最关键设置：**
```
设置 → 电池 → 应用启动管理 → 关闭「自动管理」
手动开启：允许后台活动 + 允许自启动 + 允许关联启动
```

### 小米 / 红米 (Xiaomi / Redmi)  
**最关键设置：**
```
应用详情 → 省电策略 → 无限制
设置 → 隐私保护 → 特殊权限 → 后台弹出界面 → 允许
```

### OPPO / Realme
**最关键设置：**
```
应用详情 → 电池 → 后台冻结 → 允许后台运行
```

### Vivo / iQOO
**最关键设置：**
```
设置 → 电池 → 后台高耗电 → 允许后台高耗电
```

## Why This Matters

Chinese Android phones have **aggressive battery optimization** that:
- Kills apps in background
- Blocks microphone access
- Prevents PWAs from running continuously

## What We Added to Help Page

1. ✅ Manufacturer-specific permission instructions
2. ✅ Battery optimization settings
3. ✅ Background activity permissions
4. ✅ Special permissions for each brand
5. ✅ FAQ entries for common issues

## User Impact

**Before:** Users on Huawei/Xiaomi phones couldn't use the app properly
**After:** Clear instructions for each phone brand to enable all necessary permissions

## Files Modified

- `help.html` - Added detailed instructions for each manufacturer
- `CHINESE_ANDROID_COMPATIBILITY.md` - Comprehensive technical guide
- `PERMISSION_SUMMARY.md` - This quick reference

## Testing Recommendations

Test on:
- [ ] Huawei P40 / Mate series (EMUI/HarmonyOS)
- [ ] Xiaomi 12 / 13 series (MIUI 14)
- [ ] OPPO Find X series (ColorOS)
- [ ] Vivo X series (Funtouch OS)
- [ ] Standard Android (Google Pixel) - baseline

## Common User Complaints Addressed

1. "麦克风没有声音" → Check manufacturer-specific permission settings
2. "应用自动关闭" → Disable battery optimization
3. "锁屏后停止工作" → Enable background activity
4. "重启后不工作" → Enable auto-start permission
