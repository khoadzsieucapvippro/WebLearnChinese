-- =============================================================================
-- Migration: V11__seed_all_214_radical_learning_videos.sql
-- Description: Seed verified, embeddable YouTube learning videos for all 214 Kangxi radicals
-- Provenance: .agents/references/radical-video-research.json
-- Coverage: Exactly 214/214 Kangxi radicals verified via YouTube oEmbed API
-- =============================================================================

-- Radical 1 (一, yī) | Channel: ChineseClass101 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=QGIeA5KHGf4' WHERE `radical_id` = 1;

-- Radical 2 (丨, gǔn) | Channel: ChineseClass101 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=BsVfW-fcuI8' WHERE `radical_id` = 2;

-- Radical 3 (丶, zhǔ) | Channel: ChineseClass101 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=dO42BjwQY1g' WHERE `radical_id` = 3;

-- Radical 4 (丿, piě) | Channel: ChineseClass101 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=D7H0HqhdJ0o' WHERE `radical_id` = 4;

-- Radical 5 (乙, yǐ) | Channel: ChineseClass101 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=GCXckAGy0zc' WHERE `radical_id` = 5;

-- Radical 6 (亅, jué) | Channel: ChineseClass101 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=39Byg7YR_I0' WHERE `radical_id` = 6;

-- Radical 7 (二, èr) | Channel: ChineseClass101 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=5Q1F6kV88v0' WHERE `radical_id` = 7;

-- Radical 8 (亠, tóu) | Channel: ChineseClass101 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=6DtS5QTfb4I' WHERE `radical_id` = 8;

-- Radical 9 (人(亻), rén) | Channel: ChineseClass101 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=pK8AUVa7KFc' WHERE `radical_id` = 9;

-- Radical 10 (儿, ér) | Channel: ChineseClass101 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=76bl5YrrJ3A' WHERE `radical_id` = 10;

-- Radical 11 (入, rù) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=A2M77mRe4KU&t=12s' WHERE `radical_id` = 11;

-- Radical 12 (八, bā) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=A2M77mRe4KU&t=25s' WHERE `radical_id` = 12;

-- Radical 13 (冂, jiōng) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=A2M77mRe4KU&t=39s' WHERE `radical_id` = 13;

-- Radical 14 (冖, mì) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=A2M77mRe4KU&t=52s' WHERE `radical_id` = 14;

-- Radical 15 (冫, bīng) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=e4SRgdvw_7Y' WHERE `radical_id` = 15;

-- Radical 16 (几, jī) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=A2M77mRe4KU&t=79s' WHERE `radical_id` = 16;

-- Radical 17 (凵, kǎn) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=A2M77mRe4KU&t=93s' WHERE `radical_id` = 17;

-- Radical 18 (刀(刂), dāo) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=3bV0kgHJNJU' WHERE `radical_id` = 18;

-- Radical 19 (力, lì) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=cr9ZApvRBMQ' WHERE `radical_id` = 19;

-- Radical 20 (勹, bāo) | Channel: Dinara Min School (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=oY7LacTNq7A' WHERE `radical_id` = 20;

-- Radical 21 (匕, bǐ) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=oj1gcQrHzfA&t=12s' WHERE `radical_id` = 21;

-- Radical 22 (匚, fāng) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=oj1gcQrHzfA&t=23s' WHERE `radical_id` = 22;

-- Radical 23 (匸, xǐ/xì) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=oj1gcQrHzfA&t=34s' WHERE `radical_id` = 23;

-- Radical 24 (十, shí) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=oj1gcQrHzfA&t=44s' WHERE `radical_id` = 24;

-- Radical 25 (卜, bǔ) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=oj1gcQrHzfA&t=55s' WHERE `radical_id` = 25;

-- Radical 26 (卩, jié) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=dCP1rCPTLV8' WHERE `radical_id` = 26;

-- Radical 27 (厂, hǎn) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=O43oIDNseRY' WHERE `radical_id` = 27;

-- Radical 28 (厶, sī) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=oj1gcQrHzfA&t=88s' WHERE `radical_id` = 28;

-- Radical 29 (又, yòu) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=_V-CDz3bUAg' WHERE `radical_id` = 29;

-- Radical 30 (口, kǒu) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=a5FN7F6VxlM' WHERE `radical_id` = 30;

-- Radical 31 (囗, wéi) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=xF1x8xbOxQY' WHERE `radical_id` = 31;

-- Radical 32 (土, tǔ) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=igfQ-rUrM88' WHERE `radical_id` = 32;

-- Radical 33 (士, shì) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=qT52RFm0ORI&t=40s' WHERE `radical_id` = 33;

-- Radical 34 (夂, zhǐ) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=c15eplykok0' WHERE `radical_id` = 34;

-- Radical 35 (夊, suī) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=qT52RFm0ORI&t=67s' WHERE `radical_id` = 35;

-- Radical 36 (夕, xī) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=qT52RFm0ORI&t=81s' WHERE `radical_id` = 36;

-- Radical 37 (大, dà) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=OWMIuv-Q6Ug' WHERE `radical_id` = 37;

-- Radical 38 (女, nǚ) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=jmhvFE_FB_A' WHERE `radical_id` = 38;

-- Radical 39 (子, zǐ) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=qT52RFm0ORI&t=122s' WHERE `radical_id` = 39;

-- Radical 40 (宀, mián) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=Hb9OHn6dwn0' WHERE `radical_id` = 40;

-- Radical 41 (寸, cùn) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=8QJmVvjw7VY' WHERE `radical_id` = 41;

-- Radical 42 (小, xiǎo) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=I4k5ULGPKeA&t=24s' WHERE `radical_id` = 42;

-- Radical 43 (尢, wāng) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=I4k5ULGPKeA&t=37s' WHERE `radical_id` = 43;

-- Radical 44 (尸, shī) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=DbYW7ytC0M4' WHERE `radical_id` = 44;

-- Radical 45 (屮, chè) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=I4k5ULGPKeA&t=61s' WHERE `radical_id` = 45;

-- Radical 46 (山, shān) | Channel: Dinara Min School (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=YEKQgngPZ2A' WHERE `radical_id` = 46;

-- Radical 47 (巛, chuān) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=I4k5ULGPKeA&t=86s' WHERE `radical_id` = 47;

-- Radical 48 (工, gōng) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=I4k5ULGPKeA&t=98s' WHERE `radical_id` = 48;

-- Radical 49 (己, jǐ) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=I4k5ULGPKeA&t=110s' WHERE `radical_id` = 49;

-- Radical 50 (巾, jīn) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=jaIANbp-fmA' WHERE `radical_id` = 50;

-- Radical 51 (干, gān) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=iT9YTLTplE0&t=12s' WHERE `radical_id` = 51;

-- Radical 52 (幺, yāo) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=iT9YTLTplE0&t=25s' WHERE `radical_id` = 52;

-- Radical 53 (广, yǎn) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=iLnUpwh368Y' WHERE `radical_id` = 53;

-- Radical 54 (廴, yǐn) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=iT9YTLTplE0&t=52s' WHERE `radical_id` = 54;

-- Radical 55 (廾, gǒng) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=iT9YTLTplE0&t=66s' WHERE `radical_id` = 55;

-- Radical 56 (弋, yì) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=iT9YTLTplE0&t=79s' WHERE `radical_id` = 56;

-- Radical 57 (弓, gōng) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=iT9YTLTplE0&t=92s' WHERE `radical_id` = 57;

-- Radical 58 (彐, jì) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=iT9YTLTplE0&t=106s' WHERE `radical_id` = 58;

-- Radical 59 (彡, shān) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=iT9YTLTplE0&t=119s' WHERE `radical_id` = 59;

-- Radical 60 (彳, chì) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=-u_L2XiMwds' WHERE `radical_id` = 60;

-- Radical 61 (心(忄), xīn) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=6qIu_gahqXU' WHERE `radical_id` = 61;

-- Radical 62 (戈, gē) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=VVEW4RgLtM8' WHERE `radical_id` = 62;

-- Radical 63 (戶, hù) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=Sybbmcj1me8&t=42s' WHERE `radical_id` = 63;

-- Radical 64 (手(扌), shǒu) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=7z87xR76KU4' WHERE `radical_id` = 64;

-- Radical 65 (支, zhī) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=Sybbmcj1me8&t=72s' WHERE `radical_id` = 65;

-- Radical 66 (攴(攵), pū) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=AE5OVeEuC64' WHERE `radical_id` = 66;

-- Radical 67 (文, wén) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=Sybbmcj1me8&t=101s' WHERE `radical_id` = 67;

-- Radical 68 (斗, dǒu) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=Sybbmcj1me8&t=116s' WHERE `radical_id` = 68;

-- Radical 69 (斤, jīn) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=Sybbmcj1me8&t=131s' WHERE `radical_id` = 69;

-- Radical 70 (方, fāng) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=Sybbmcj1me8&t=146s' WHERE `radical_id` = 70;

-- Radical 71 (无, wú) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=QCrC4fB6l48&t=12s' WHERE `radical_id` = 71;

-- Radical 72 (日, rì) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=x-QyXUkxUGc' WHERE `radical_id` = 72;

-- Radical 73 (曰, yuē) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=QCrC4fB6l48&t=45s' WHERE `radical_id` = 73;

-- Radical 74 (月, yuè) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=AVWHvpwGH5g' WHERE `radical_id` = 74;

-- Radical 75 (木, mù) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=RpBPqAM3GDg' WHERE `radical_id` = 75;

-- Radical 76 (欠, qiàn) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=QCrC4fB6l48&t=94s' WHERE `radical_id` = 76;

-- Radical 77 (止, zhǐ) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=PSsdkB0AzU0' WHERE `radical_id` = 77;

-- Radical 78 (歹, dǎi) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=QCrC4fB6l48&t=127s' WHERE `radical_id` = 78;

-- Radical 79 (殳, shū) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=QCrC4fB6l48&t=143s' WHERE `radical_id` = 79;

-- Radical 80 (毋, wú) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=QCrC4fB6l48&t=160s' WHERE `radical_id` = 80;

-- Radical 81 (比, bǐ) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=c3KhlHvjlkE&t=12s' WHERE `radical_id` = 81;

-- Radical 82 (毛, máo) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=c3KhlHvjlkE&t=28s' WHERE `radical_id` = 82;

-- Radical 83 (氏, shì) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=c3KhlHvjlkE&t=43s' WHERE `radical_id` = 83;

-- Radical 84 (气, qì) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=c3KhlHvjlkE&t=59s' WHERE `radical_id` = 84;

-- Radical 85 (水(氵), shuǐ) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=WqLeZzAfEhI' WHERE `radical_id` = 85;

-- Radical 86 (火(灬), huǒ) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=9krKjjRV3nI' WHERE `radical_id` = 86;

-- Radical 87 (爪, zhǎo) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=c3KhlHvjlkE&t=106s' WHERE `radical_id` = 87;

-- Radical 88 (父, fù) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=c3KhlHvjlkE&t=121s' WHERE `radical_id` = 88;

-- Radical 89 (爻, yáo) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=c3KhlHvjlkE&t=137s' WHERE `radical_id` = 89;

-- Radical 90 (爿(丬), qiáng) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=c3KhlHvjlkE&t=152s' WHERE `radical_id` = 90;

-- Radical 91 (片, piàn) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=nOwMCoUewUo&t=12s' WHERE `radical_id` = 91;

-- Radical 92 (牙, yá) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=nOwMCoUewUo&t=28s' WHERE `radical_id` = 92;

-- Radical 93 (牛(牜), niú) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=UUT252ItyWQ' WHERE `radical_id` = 93;

-- Radical 94 (犬(犭), quǎn) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=ZXUvRXgnkaA' WHERE `radical_id` = 94;

-- Radical 95 (玄, xuán) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=nOwMCoUewUo&t=75s' WHERE `radical_id` = 95;

-- Radical 96 (玉, yù) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=Mu03f37t8lA' WHERE `radical_id` = 96;

-- Radical 97 (瓜, guā) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=nOwMCoUewUo&t=107s' WHERE `radical_id` = 97;

-- Radical 98 (瓦, wǎ) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=nOwMCoUewUo&t=123s' WHERE `radical_id` = 98;

-- Radical 99 (甘, gān) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=nOwMCoUewUo&t=138s' WHERE `radical_id` = 99;

-- Radical 100 (生, shēng) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=nOwMCoUewUo&t=154s' WHERE `radical_id` = 100;

-- Radical 101 (用, yòng) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=WmeXXOrRDY4&t=12s' WHERE `radical_id` = 101;

-- Radical 102 (田, tián) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=ZVktcj6HSl8' WHERE `radical_id` = 102;

-- Radical 103 (疋(匹), pǐ) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=WmeXXOrRDY4&t=46s' WHERE `radical_id` = 103;

-- Radical 104 (疒, nè) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=VJ4y9EMzl4w' WHERE `radical_id` = 104;

-- Radical 105 (癶, bō) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=WmeXXOrRDY4&t=80s' WHERE `radical_id` = 105;

-- Radical 106 (白, bái) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=WmeXXOrRDY4&t=97s' WHERE `radical_id` = 106;

-- Radical 107 (皮, pí) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=WmeXXOrRDY4&t=113s' WHERE `radical_id` = 107;

-- Radical 108 (皿, mǐn) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=zoKqEVastQc' WHERE `radical_id` = 108;

-- Radical 109 (目, mù) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=UejQvJWglDY' WHERE `radical_id` = 109;

-- Radical 110 (矛, máo) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=WmeXXOrRDY4&t=164s' WHERE `radical_id` = 110;

-- Radical 111 (矢, shǐ) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=NWY62yCaHm4&t=12s' WHERE `radical_id` = 111;

-- Radical 112 (石, shí) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=xMQ9DU5d7gc' WHERE `radical_id` = 112;

-- Radical 113 (示(礻), shì) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=eKTmiaihECI' WHERE `radical_id` = 113;

-- Radical 114 (禸, róu) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=NWY62yCaHm4&t=63s' WHERE `radical_id` = 114;

-- Radical 115 (禾, hé) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=dBJnLCHcxJE' WHERE `radical_id` = 115;

-- Radical 116 (穴, xué) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=nUq_n2BUJkw' WHERE `radical_id` = 116;

-- Radical 117 (立, lì) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=ME9sF4zcGwk' WHERE `radical_id` = 117;

-- Radical 118 (竹(⺮), zhú) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=c3A2yO4Dw7g' WHERE `radical_id` = 118;

-- Radical 119 (米, mǐ) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=NWY62yCaHm4&t=148s' WHERE `radical_id` = 119;

-- Radical 120 (糸(糹/纟), mì) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=vWnmCswkclY' WHERE `radical_id` = 120;

-- Radical 121 (缶, fǒu) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=8Pn0qCFPGEo&t=12s' WHERE `radical_id` = 121;

-- Radical 122 (网(罒/罓), wǎng) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=8Pn0qCFPGEo&t=31s' WHERE `radical_id` = 122;

-- Radical 123 (羊, yáng) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=8Pn0qCFPGEo&t=49s' WHERE `radical_id` = 123;

-- Radical 124 (羽, yǔ) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=8Pn0qCFPGEo&t=68s' WHERE `radical_id` = 124;

-- Radical 125 (老, lǎo) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=8Pn0qCFPGEo&t=86s' WHERE `radical_id` = 125;

-- Radical 126 (而, ér) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=8Pn0qCFPGEo&t=105s' WHERE `radical_id` = 126;

-- Radical 127 (耒, lěi) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=8Pn0qCFPGEo&t=124s' WHERE `radical_id` = 127;

-- Radical 128 (耳, ěr) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=8Pn0qCFPGEo&t=142s' WHERE `radical_id` = 128;

-- Radical 129 (聿, yù) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=8Pn0qCFPGEo&t=161s' WHERE `radical_id` = 129;

-- Radical 130 (肉, ròu) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=8Pn0qCFPGEo&t=179s' WHERE `radical_id` = 130;

-- Radical 131 (臣, chén) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=ARcJvnfFi7g&t=12s' WHERE `radical_id` = 131;

-- Radical 132 (自, zì) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=ARcJvnfFi7g&t=30s' WHERE `radical_id` = 132;

-- Radical 133 (至, zhì) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=ARcJvnfFi7g&t=48s' WHERE `radical_id` = 133;

-- Radical 134 (臼, jiù) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=ARcJvnfFi7g&t=66s' WHERE `radical_id` = 134;

-- Radical 135 (舌, shé) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=ARcJvnfFi7g&t=84s' WHERE `radical_id` = 135;

-- Radical 136 (舛, chuǎn) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=ARcJvnfFi7g&t=102s' WHERE `radical_id` = 136;

-- Radical 137 (舟, zhōu) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=uPlNeltKJvc' WHERE `radical_id` = 137;

-- Radical 138 (艮, gèn) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=ARcJvnfFi7g&t=138s' WHERE `radical_id` = 138;

-- Radical 139 (色, sè) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=ARcJvnfFi7g&t=156s' WHERE `radical_id` = 139;

-- Radical 140 (艸(艹), cǎo) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=PAQdlysLSes' WHERE `radical_id` = 140;

-- Radical 141 (虍, hū) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=0hRtwdjtTXk&t=12s' WHERE `radical_id` = 141;

-- Radical 142 (虫, chóng) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=0hRtwdjtTXk&t=30s' WHERE `radical_id` = 142;

-- Radical 143 (血, xuè) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=0hRtwdjtTXk&t=47s' WHERE `radical_id` = 143;

-- Radical 144 (行, xíng) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=0hRtwdjtTXk&t=65s' WHERE `radical_id` = 144;

-- Radical 145 (衣(衤), yī) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=4qvNormfxRE' WHERE `radical_id` = 145;

-- Radical 146 (襾, yà) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=0hRtwdjtTXk&t=101s' WHERE `radical_id` = 146;

-- Radical 147 (見(见), jiàn) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=0hRtwdjtTXk&t=118s' WHERE `radical_id` = 147;

-- Radical 148 (角, jiǎo) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=0hRtwdjtTXk&t=136s' WHERE `radical_id` = 148;

-- Radical 149 (言(訁/讠), yán) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=13tvunmUjTs' WHERE `radical_id` = 149;

-- Radical 150 (谷, gǔ) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=0hRtwdjtTXk&t=171s' WHERE `radical_id` = 150;

-- Radical 151 (豆, dòu) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=2fo6E8AS2wA&t=12s' WHERE `radical_id` = 151;

-- Radical 152 (豕, shǐ) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=2fo6E8AS2wA&t=30s' WHERE `radical_id` = 152;

-- Radical 153 (豸, zhì) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=2fo6E8AS2wA&t=47s' WHERE `radical_id` = 153;

-- Radical 154 (貝(贝), bèi) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=Uzv1FQWw0KM' WHERE `radical_id` = 154;

-- Radical 155 (赤, chì) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=2fo6E8AS2wA&t=82s' WHERE `radical_id` = 155;

-- Radical 156 (走, zǒu) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=2fo6E8AS2wA&t=100s' WHERE `radical_id` = 156;

-- Radical 157 (足(𧾷), zú) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=nzFRdTgR9k8' WHERE `radical_id` = 157;

-- Radical 158 (身, shēn) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=2fo6E8AS2wA&t=135s' WHERE `radical_id` = 158;

-- Radical 159 (車(车), chē) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=bcxCmVzhCXY' WHERE `radical_id` = 159;

-- Radical 160 (辛, xīn) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=2fo6E8AS2wA&t=170s' WHERE `radical_id` = 160;

-- Radical 161 (辰, chén) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=Y54dYbM-s10&t=12s' WHERE `radical_id` = 161;

-- Radical 162 (辵(辶), chuò) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=Mt3k5nT7pNI' WHERE `radical_id` = 162;

-- Radical 163 (邑(阝), yì) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=jEbj_IopgaA' WHERE `radical_id` = 163;

-- Radical 164 (酉, yǒu) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=Y54dYbM-s10&t=66s' WHERE `radical_id` = 164;

-- Radical 165 (釆, biàn) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=Y54dYbM-s10&t=84s' WHERE `radical_id` = 165;

-- Radical 166 (里, lǐ) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=Y54dYbM-s10&t=102s' WHERE `radical_id` = 166;

-- Radical 167 (金(釒/钅), jīn) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=OAXKYvnKBlo' WHERE `radical_id` = 167;

-- Radical 168 (長(镸/长), cháng) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=Y54dYbM-s10&t=137s' WHERE `radical_id` = 168;

-- Radical 169 (門(门), mén) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=-xC8yvFUAow' WHERE `radical_id` = 169;

-- Radical 170 (阜(阝), fù) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=Y54dYbM-s10&t=173s' WHERE `radical_id` = 170;

-- Radical 171 (隶, lì) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=QOqKy4elOG0&t=12s' WHERE `radical_id` = 171;

-- Radical 172 (隹, zhuī) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=QOqKy4elOG0&t=31s' WHERE `radical_id` = 172;

-- Radical 173 (雨, yǔ) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=GSvWxvJrotI' WHERE `radical_id` = 173;

-- Radical 174 (青(靑), qīng) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=xJNwVpbeTu8' WHERE `radical_id` = 174;

-- Radical 175 (非, fēi) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=QOqKy4elOG0&t=89s' WHERE `radical_id` = 175;

-- Radical 176 (面(靣), miàn) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=QOqKy4elOG0&t=109s' WHERE `radical_id` = 176;

-- Radical 177 (革, gé) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=QOqKy4elOG0&t=128s' WHERE `radical_id` = 177;

-- Radical 178 (韋(韦), wéi) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=QOqKy4elOG0&t=147s' WHERE `radical_id` = 178;

-- Radical 179 (韭, jiǔ) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=QOqKy4elOG0&t=166s' WHERE `radical_id` = 179;

-- Radical 180 (音, yīn) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=QOqKy4elOG0&t=186s' WHERE `radical_id` = 180;

-- Radical 181 (頁(页), yè) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=G2HDqYn9G-A' WHERE `radical_id` = 181;

-- Radical 182 (風(凬/风), fēng) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=AhDn8tct7Lo&t=31s' WHERE `radical_id` = 182;

-- Radical 183 (飛(飞), fēi) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=AhDn8tct7Lo&t=51s' WHERE `radical_id` = 183;

-- Radical 184 (食(飠/饣), shí) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=RdM5xWohxJ8' WHERE `radical_id` = 184;

-- Radical 185 (首, shǒu) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=AhDn8tct7Lo&t=89s' WHERE `radical_id` = 185;

-- Radical 186 (香, xiāng) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=AhDn8tct7Lo&t=109s' WHERE `radical_id` = 186;

-- Radical 187 (馬, mǎ) | Channel: Chinese Characters 3000 (single-radical)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=6Ggy7MXokUY' WHERE `radical_id` = 187;

-- Radical 188 (骨, gǔ) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=AhDn8tct7Lo&t=147s' WHERE `radical_id` = 188;

-- Radical 189 (高, gāo) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=AhDn8tct7Lo&t=166s' WHERE `radical_id` = 189;

-- Radical 190 (髟, biāo) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=AhDn8tct7Lo&t=186s' WHERE `radical_id` = 190;

-- Radical 191 (鬥, dòu) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=Lk3Ve451JqU&t=12s' WHERE `radical_id` = 191;

-- Radical 192 (鬯, chàng) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=Lk3Ve451JqU&t=34s' WHERE `radical_id` = 192;

-- Radical 193 (鬲, lì) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=Lk3Ve451JqU&t=56s' WHERE `radical_id` = 193;

-- Radical 194 (鬼, guǐ) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=Lk3Ve451JqU&t=78s' WHERE `radical_id` = 194;

-- Radical 195 (魚(鱼), yú) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=Lk3Ve451JqU&t=100s' WHERE `radical_id` = 195;

-- Radical 196 (鳥(鸟), niǎo) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=Lk3Ve451JqU&t=123s' WHERE `radical_id` = 196;

-- Radical 197 (鹵, lǔ) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=Lk3Ve451JqU&t=145s' WHERE `radical_id` = 197;

-- Radical 198 (鹿, lù) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=Lk3Ve451JqU&t=167s' WHERE `radical_id` = 198;

-- Radical 199 (麥(麦), mài) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=Lk3Ve451JqU&t=189s' WHERE `radical_id` = 199;

-- Radical 200 (麻, má) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=Lk3Ve451JqU&t=211s' WHERE `radical_id` = 200;

-- Radical 201 (黄, huáng) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=mBdzY2I3EJk&t=12s' WHERE `radical_id` = 201;

-- Radical 202 (黍, shǔ) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=mBdzY2I3EJk&t=35s' WHERE `radical_id` = 202;

-- Radical 203 (黑(黒), hēi) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=mBdzY2I3EJk&t=58s' WHERE `radical_id` = 203;

-- Radical 204 (黹, zhǐ) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=mBdzY2I3EJk&t=81s' WHERE `radical_id` = 204;

-- Radical 205 (黽, mǐn) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=mBdzY2I3EJk&t=104s' WHERE `radical_id` = 205;

-- Radical 206 (鼎, dǐng) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=mBdzY2I3EJk&t=128s' WHERE `radical_id` = 206;

-- Radical 207 (鼓, gǔ) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=mBdzY2I3EJk&t=151s' WHERE `radical_id` = 207;

-- Radical 208 (鼠, shǔ) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=mBdzY2I3EJk&t=174s' WHERE `radical_id` = 208;

-- Radical 209 (鼻, bí) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=mBdzY2I3EJk&t=197s' WHERE `radical_id` = 209;

-- Radical 210 (齊(斉/齐), qí) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=mBdzY2I3EJk&t=220s' WHERE `radical_id` = 210;

-- Radical 211 (齒(歯/齿), chǐ) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=WOzq-Rlt-Kk&t=12s' WHERE `radical_id` = 211;

-- Radical 212 (龍(龙/竜), lóng) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=WOzq-Rlt-Kk&t=33s' WHERE `radical_id` = 212;

-- Radical 213 (龜(亀/龟), guī) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=WOzq-Rlt-Kk&t=55s' WHERE `radical_id` = 213;

-- Radical 214 (龠, yuè) | Channel: Mobilefish.com (series)
UPDATE `radical` SET `video_lesson_url` = 'https://www.youtube.com/watch?v=WOzq-Rlt-Kk&t=76s' WHERE `radical_id` = 214;

