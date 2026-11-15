import {Config} from '@remotion/cli/config';

// إعدادات خفيفة مناسبة لـ Intel UHD 630 وRAM 16GB
Config.setEntryPoint('src/index.ts');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);
Config.setConcurrency(2);
Config.setCodec('h264');
Config.setCrf(18);
Config.setPixelFormat('yuv420p');
// bt709 بمدى tv: ألوان صحيحة على المشغلات ومنصات السوشال (بدونه يخرج yuvj420p)
Config.setColorSpace('bt709');
