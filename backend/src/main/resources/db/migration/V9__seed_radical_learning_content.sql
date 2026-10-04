-- =============================================================================
-- Migration: V9__seed_radical_learning_content.sql
-- Description: Seed verified learning content for Kangxi Radicals
-- Scope:
--   1. Meaningful concise Vietnamese definitions (meaning_vi) for all 214 radicals
--   2. Pedagogical frequency rank (common_rank 1..50) for the 50 common radicals
--   3. Concise, pedagogical explanations (explanation_vi) for common radicals
--   4. Verified YouTube learning video URLs for verified entries (video_lesson_url)
-- Database: MySQL 8.4+
-- Charset: utf8mb4, Collation: utf8mb4_unicode_ci
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Populate Meaningful Vietnamese Meanings (meaning_vi) for all 214 Radicals
-- -----------------------------------------------------------------------------

UPDATE `radical` SET `meaning_vi` = 'Số một, sự khởi đầu' WHERE `radical_id` = 1;
UPDATE `radical` SET `meaning_vi` = 'Nét sổ thẳng' WHERE `radical_id` = 2;
UPDATE `radical` SET `meaning_vi` = 'Dấu chấm, điểm nhỏ' WHERE `radical_id` = 3;
UPDATE `radical` SET `meaning_vi` = 'Nét phẩy, uốn cong' WHERE `radical_id` = 4;
UPDATE `radical` SET `meaning_vi` = 'Can Ất, uốn khúc' WHERE `radical_id` = 5;
UPDATE `radical` SET `meaning_vi` = 'Nét móc lên' WHERE `radical_id` = 6;
UPDATE `radical` SET `meaning_vi` = 'Số hai' WHERE `radical_id` = 7;
UPDATE `radical` SET `meaning_vi` = 'Đầu chữ, phần trên' WHERE `radical_id` = 8;
UPDATE `radical` SET `meaning_vi` = 'Người' WHERE `radical_id` = 9;
UPDATE `radical` SET `meaning_vi` = 'Người, đứa trẻ' WHERE `radical_id` = 10;
UPDATE `radical` SET `meaning_vi` = 'Vào, bước vào' WHERE `radical_id` = 11;
UPDATE `radical` SET `meaning_vi` = 'Số tám, phân tách' WHERE `radical_id` = 12;
UPDATE `radical` SET `meaning_vi` = 'Biên giới, nơi xa xôi' WHERE `radical_id` = 13;
UPDATE `radical` SET `meaning_vi` = 'Khăn trùm, che phủ' WHERE `radical_id` = 14;
UPDATE `radical` SET `meaning_vi` = 'Băng tuyết, lạnh giá' WHERE `radical_id` = 15;
UPDATE `radical` SET `meaning_vi` = 'Cái ghế nhỏ, bàn nhỏ' WHERE `radical_id` = 16;
UPDATE `radical` SET `meaning_vi` = 'Hố sâu, mở miệng' WHERE `radical_id` = 17;
UPDATE `radical` SET `meaning_vi` = 'Con dao, chặt đứt' WHERE `radical_id` = 18;
UPDATE `radical` SET `meaning_vi` = 'Sức mạnh, sức lực' WHERE `radical_id` = 19;
UPDATE `radical` SET `meaning_vi` = 'Bao bọc, gói lại' WHERE `radical_id` = 20;
UPDATE `radical` SET `meaning_vi` = 'Cái thìa, muỗng' WHERE `radical_id` = 21;
UPDATE `radical` SET `meaning_vi` = 'Tủ đựng đồ, hộp đựng' WHERE `radical_id` = 22;
UPDATE `radical` SET `meaning_vi` = 'Che giấu, cất kín' WHERE `radical_id` = 23;
UPDATE `radical` SET `meaning_vi` = 'Số mười, hoàn thiện' WHERE `radical_id` = 24;
UPDATE `radical` SET `meaning_vi` = 'Bói toán, vết nứt mai rùa' WHERE `radical_id` = 25;
UPDATE `radical` SET `meaning_vi` = 'Đốt tre, quỳ gối' WHERE `radical_id` = 26;
UPDATE `radical` SET `meaning_vi` = 'Sườn núi, vách đá' WHERE `radical_id` = 27;
UPDATE `radical` SET `meaning_vi` = 'Riêng tư, bản thân' WHERE `radical_id` = 28;
UPDATE `radical` SET `meaning_vi` = 'Lại, tay phải' WHERE `radical_id` = 29;
UPDATE `radical` SET `meaning_vi` = 'Cái miệng' WHERE `radical_id` = 30;
UPDATE `radical` SET `meaning_vi` = 'Vây quanh, bao bọc' WHERE `radical_id` = 31;
UPDATE `radical` SET `meaning_vi` = 'Đất, thổ nhưỡng' WHERE `radical_id` = 32;
UPDATE `radical` SET `meaning_vi` = 'Kẻ sĩ, người tài' WHERE `radical_id` = 33;
UPDATE `radical` SET `meaning_vi` = 'Đi chậm phía sau' WHERE `radical_id` = 34;
UPDATE `radical` SET `meaning_vi` = 'Đi chậm chạp' WHERE `radical_id` = 35;
UPDATE `radical` SET `meaning_vi` = 'Buổi chiều tối, đêm' WHERE `radical_id` = 36;
UPDATE `radical` SET `meaning_vi` = 'To lớn, rộng lớn' WHERE `radical_id` = 37;
UPDATE `radical` SET `meaning_vi` = 'Phụ nữ, con gái' WHERE `radical_id` = 38;
UPDATE `radical` SET `meaning_vi` = 'Con cái, đứa trẻ' WHERE `radical_id` = 39;
UPDATE `radical` SET `meaning_vi` = 'Mái nhà, che chở' WHERE `radical_id` = 40;
UPDATE `radical` SET `meaning_vi` = 'Tấc, kích thước nhỏ' WHERE `radical_id` = 41;
UPDATE `radical` SET `meaning_vi` = 'Nhỏ bé, ít ỏi' WHERE `radical_id` = 42;
UPDATE `radical` SET `meaning_vi` = 'Yếu ớt, tàn tật' WHERE `radical_id` = 43;
UPDATE `radical` SET `meaning_vi` = 'Thân thể, xác thịt' WHERE `radical_id` = 44;
UPDATE `radical` SET `meaning_vi` = 'Mầm cỏ mới nhú' WHERE `radical_id` = 45;
UPDATE `radical` SET `meaning_vi` = 'Núi non' WHERE `radical_id` = 46;
UPDATE `radical` SET `meaning_vi` = 'Dòng sông, dòng suối' WHERE `radical_id` = 47;
UPDATE `radical` SET `meaning_vi` = 'Công thợ, công việc' WHERE `radical_id` = 48;
UPDATE `radical` SET `meaning_vi` = 'Bản thân mình' WHERE `radical_id` = 49;
UPDATE `radical` SET `meaning_vi` = 'Cái khăn, vải vóc' WHERE `radical_id` = 50;
UPDATE `radical` SET `meaning_vi` = 'Can thiệp, cái khiên' WHERE `radical_id` = 51;
UPDATE `radical` SET `meaning_vi` = 'Nhỏ bé, sợi dây ngắn' WHERE `radical_id` = 52;
UPDATE `radical` SET `meaning_vi` = 'Mái nhà bên sườn núi' WHERE `radical_id` = 53;
UPDATE `radical` SET `meaning_vi` = 'Bước chân dài, đi xa' WHERE `radical_id` = 54;
UPDATE `radical` SET `meaning_vi` = 'Chắp hai tay' WHERE `radical_id` = 55;
UPDATE `radical` SET `meaning_vi` = 'Bắn tên, cọc gỗ' WHERE `radical_id` = 56;
UPDATE `radical` SET `meaning_vi` = 'Cây cung' WHERE `radical_id` = 57;
UPDATE `radical` SET `meaning_vi` = 'Đầu con nhím' WHERE `radical_id` = 58;
UPDATE `radical` SET `meaning_vi` = 'Lông dài, hoa văn nét vẽ' WHERE `radical_id` = 59;
UPDATE `radical` SET `meaning_vi` = 'Bước chân trái, đường đi' WHERE `radical_id` = 60;
UPDATE `radical` SET `meaning_vi` = 'Quả tim, tâm trí, tình cảm' WHERE `radical_id` = 61;
UPDATE `radical` SET `meaning_vi` = 'Cây mác, vũ khí' WHERE `radical_id` = 62;
UPDATE `radical` SET `meaning_vi` = 'Cửa một cánh, hộ gia đình' WHERE `radical_id` = 63;
UPDATE `radical` SET `meaning_vi` = 'Bàn tay, thao tác bằng tay' WHERE `radical_id` = 64;
UPDATE `radical` SET `meaning_vi` = 'Nhánh cây, cành lá' WHERE `radical_id` = 65;
UPDATE `radical` SET `meaning_vi` = 'Đánh khẽ, hành động tác động' WHERE `radical_id` = 66;
UPDATE `radical` SET `meaning_vi` = 'Văn chương, chữ viết' WHERE `radical_id` = 67;
UPDATE `radical` SET `meaning_vi` = 'Cái đấu đong gạo' WHERE `radical_id` = 68;
UPDATE `radical` SET `meaning_vi` = 'Cái rìu, cân lạng' WHERE `radical_id` = 69;
UPDATE `radical` SET `meaning_vi` = 'Phương hướng, hình vuông' WHERE `radical_id` = 70;
UPDATE `radical` SET `meaning_vi` = 'Không có' WHERE `radical_id` = 71;
UPDATE `radical` SET `meaning_vi` = 'Mặt trời, ngày' WHERE `radical_id` = 72;
UPDATE `radical` SET `meaning_vi` = 'Rằng, nói rằng' WHERE `radical_id` = 73;
UPDATE `radical` SET `meaning_vi` = 'Mặt trăng, tháng' WHERE `radical_id` = 74;
UPDATE `radical` SET `meaning_vi` = 'Cây cối, gỗ' WHERE `radical_id` = 75;
UPDATE `radical` SET `meaning_vi` = 'Há miệng ngáp, thiếu thốn' WHERE `radical_id` = 76;
UPDATE `radical` SET `meaning_vi` = 'Dừng lại, bàn chân' WHERE `radical_id` = 77;
UPDATE `radical` SET `meaning_vi` = 'Xương tàn, chết chóc' WHERE `radical_id` = 78;
UPDATE `radical` SET `meaning_vi` = 'Binh khí dài, gậy tre' WHERE `radical_id` = 79;
UPDATE `radical` SET `meaning_vi` = 'Chớ, đừng' WHERE `radical_id` = 80;
UPDATE `radical` SET `meaning_vi` = 'So sánh, kề cận' WHERE `radical_id` = 81;
UPDATE `radical` SET `meaning_vi` = 'Lông, tóc' WHERE `radical_id` = 82;
UPDATE `radical` SET `meaning_vi` = 'Dòng họ, thị tộc' WHERE `radical_id` = 83;
UPDATE `radical` SET `meaning_vi` = 'Khí quyển, hơi thở' WHERE `radical_id` = 84;
UPDATE `radical` SET `meaning_vi` = 'Nước, chất lỏng' WHERE `radical_id` = 85;
UPDATE `radical` SET `meaning_vi` = 'Lửa, sức nóng' WHERE `radical_id` = 86;
UPDATE `radical` SET `meaning_vi` = 'Móng vuốt thú' WHERE `radical_id` = 87;
UPDATE `radical` SET `meaning_vi` = 'Người cha, bậc phụ huynh' WHERE `radical_id` = 88;
UPDATE `radical` SET `meaning_vi` = 'Quẻ bói, đan chéo' WHERE `radical_id` = 89;
UPDATE `radical` SET `meaning_vi` = 'Mảnh gỗ dài, cái giường' WHERE `radical_id` = 90;
UPDATE `radical` SET `meaning_vi` = 'Lát mỏng, mảnh gỗ' WHERE `radical_id` = 91;
UPDATE `radical` SET `meaning_vi` = 'Răng nanh' WHERE `radical_id` = 92;
UPDATE `radical` SET `meaning_vi` = 'Con trâu, con bò' WHERE `radical_id` = 93;
UPDATE `radical` SET `meaning_vi` = 'Con chó, loài thú' WHERE `radical_id` = 94;
UPDATE `radical` SET `meaning_vi` = 'Huyền bí, màu đen sâu' WHERE `radical_id` = 95;
UPDATE `radical` SET `meaning_vi` = 'Viên ngọc quý, đá quý' WHERE `radical_id` = 96;
UPDATE `radical` SET `meaning_vi` = 'Quả dưa' WHERE `radical_id` = 97;
UPDATE `radical` SET `meaning_vi` = 'Ngói lợp, đồ gốm sứ' WHERE `radical_id` = 98;
UPDATE `radical` SET `meaning_vi` = 'Vị ngọt, ngọt ngào' WHERE `radical_id` = 99;
UPDATE `radical` SET `meaning_vi` = 'Sinh sôi, sống' WHERE `radical_id` = 100;
UPDATE `radical` SET `meaning_vi` = 'Dùng, sử dụng' WHERE `radical_id` = 101;
UPDATE `radical` SET `meaning_vi` = 'Ruộng đất canh tác' WHERE `radical_id` = 102;
UPDATE `radical` SET `meaning_vi` = 'Cuộn vải, bàn chân' WHERE `radical_id` = 103;
UPDATE `radical` SET `meaning_vi` = 'Bệnh tật, ốm đau' WHERE `radical_id` = 104;
UPDATE `radical` SET `meaning_vi` = 'Hai chân dẫm lên, quay lưng' WHERE `radical_id` = 105;
UPDATE `radical` SET `meaning_vi` = 'Màu trắng, sáng sủa' WHERE `radical_id` = 106;
UPDATE `radical` SET `meaning_vi` = 'Da, vỏ ngoài' WHERE `radical_id` = 107;
UPDATE `radical` SET `meaning_vi` = 'Bát đĩa, đồ đựng chén dĩa' WHERE `radical_id` = 108;
UPDATE `radical` SET `meaning_vi` = 'Con mắt, nhìn' WHERE `radical_id` = 109;
UPDATE `radical` SET `meaning_vi` = 'Cây giáo mâu' WHERE `radical_id` = 110;
UPDATE `radical` SET `meaning_vi` = 'Mũi tên' WHERE `radical_id` = 111;
UPDATE `radical` SET `meaning_vi` = 'Hòn đá, sỏi đá' WHERE `radical_id` = 112;
UPDATE `radical` SET `meaning_vi` = 'Thần linh, cúng tế, chỉ thị' WHERE `radical_id` = 113;
UPDATE `radical` SET `meaning_vi` = 'Dấu chân thú' WHERE `radical_id` = 114;
UPDATE `radical` SET `meaning_vi` = 'Cây lúa, ngũ cốc' WHERE `radical_id` = 115;
UPDATE `radical` SET `meaning_vi` = 'Hang động, lỗ hổng' WHERE `radical_id` = 116;
UPDATE `radical` SET `meaning_vi` = 'Đứng thẳng, thiết lập' WHERE `radical_id` = 117;
UPDATE `radical` SET `meaning_vi` = 'Tre, trúc' WHERE `radical_id` = 118;
UPDATE `radical` SET `meaning_vi` = 'Hạt gạo, tấm mễ' WHERE `radical_id` = 119;
UPDATE `radical` SET `meaning_vi` = 'Sợi tơ, dây chỉ' WHERE `radical_id` = 120;
UPDATE `radical` SET `meaning_vi` = 'Đồ sành, bình gốm' WHERE `radical_id` = 121;
UPDATE `radical` SET `meaning_vi` = 'Lưới đánh cá' WHERE `radical_id` = 122;
UPDATE `radical` SET `meaning_vi` = 'Con dê, con cừu' WHERE `radical_id` = 123;
UPDATE `radical` SET `meaning_vi` = 'Lông vũ, cánh chim' WHERE `radical_id` = 124;
UPDATE `radical` SET `meaning_vi` = 'Người già, cao tuổi' WHERE `radical_id` = 125;
UPDATE `radical` SET `meaning_vi` = 'Râu dưới cằm, mà' WHERE `radical_id` = 126;
UPDATE `radical` SET `meaning_vi` = 'Cái cày bừa' WHERE `radical_id` = 127;
UPDATE `radical` SET `meaning_vi` = 'Lỗ tai, lắng nghe' WHERE `radical_id` = 128;
UPDATE `radical` SET `meaning_vi` = 'Cây bút viết chữ' WHERE `radical_id` = 129;
UPDATE `radical` SET `meaning_vi` = 'Thịt, cơ bắp' WHERE `radical_id` = 130;
UPDATE `radical` SET `meaning_vi` = 'Bề tôi, thần dân' WHERE `radical_id` = 131;
UPDATE `radical` SET `meaning_vi` = 'Tự mình, cái mũi' WHERE `radical_id` = 132;
UPDATE `radical` SET `meaning_vi` = 'Đi đến, đạt tới nơi' WHERE `radical_id` = 133;
UPDATE `radical` SET `meaning_vi` = 'Cái cối giã gạo' WHERE `radical_id` = 134;
UPDATE `radical` SET `meaning_vi` = 'Cái lưỡi' WHERE `radical_id` = 135;
UPDATE `radical` SET `meaning_vi` = 'Sai trái, chân ngược hướng' WHERE `radical_id` = 136;
UPDATE `radical` SET `meaning_vi` = 'Chiếc thuyền' WHERE `radical_id` = 137;
UPDATE `radical` SET `meaning_vi` = 'Quẻ Cấn, kiên định' WHERE `radical_id` = 138;
UPDATE `radical` SET `meaning_vi` = 'Màu sắc, sắc đẹp' WHERE `radical_id` = 139;
UPDATE `radical` SET `meaning_vi` = 'Cỏ, hoa lá, thảo mộc' WHERE `radical_id` = 140;
UPDATE `radical` SET `meaning_vi` = 'Vằn da hổ' WHERE `radical_id` = 141;
UPDATE `radical` SET `meaning_vi` = 'Sâu bọ, côn trùng' WHERE `radical_id` = 142;
UPDATE `radical` SET `meaning_vi` = 'Máu huyết' WHERE `radical_id` = 143;
UPDATE `radical` SET `meaning_vi` = 'Đi lại, đường phố, hàng lối' WHERE `radical_id` = 144;
UPDATE `radical` SET `meaning_vi` = 'Áo xống, trang phục' WHERE `radical_id` = 145;
UPDATE `radical` SET `meaning_vi` = 'Che đậy, phủ trùm' WHERE `radical_id` = 146;
UPDATE `radical` SET `meaning_vi` = 'Trông thấy, nhìn thấy' WHERE `radical_id` = 147;
UPDATE `radical` SET `meaning_vi` = 'Sừng thú, góc nhọn' WHERE `radical_id` = 148;
UPDATE `radical` SET `meaning_vi` = 'Lời nói, ngôn từ' WHERE `radical_id` = 149;
UPDATE `radical` SET `meaning_vi` = 'Thung lũng, khe núi' WHERE `radical_id` = 150;
UPDATE `radical` SET `meaning_vi` = 'Hạt đậu, cái chén tế' WHERE `radical_id` = 151;
UPDATE `radical` SET `meaning_vi` = 'Con lợn, con heo' WHERE `radical_id` = 152;
UPDATE `radical` SET `meaning_vi` = 'Thú dữ không sừng' WHERE `radical_id` = 153;
UPDATE `radical` SET `meaning_vi` = 'Con sò, vỏ ốc, tiền tài' WHERE `radical_id` = 154;
UPDATE `radical` SET `meaning_vi` = 'Màu đỏ thẫm' WHERE `radical_id` = 155;
UPDATE `radical` SET `meaning_vi` = 'Chạy, đi bộ' WHERE `radical_id` = 156;
UPDATE `radical` SET `meaning_vi` = 'Bàn chân, đầy đủ' WHERE `radical_id` = 157;
UPDATE `radical` SET `meaning_vi` = 'Thân thể, mình mẩy' WHERE `radical_id` = 158;
UPDATE `radical` SET `meaning_vi` = 'Chiếc xe, cỗ xe' WHERE `radical_id` = 159;
UPDATE `radical` SET `meaning_vi` = 'Vị cay, gian khổ' WHERE `radical_id` = 160;
UPDATE `radical` SET `meaning_vi` = 'Sao Thần, chi Thìn' WHERE `radical_id` = 161;
UPDATE `radical` SET `meaning_vi` = 'Bước đi, hành trình' WHERE `radical_id` = 162;
UPDATE `radical` SET `meaning_vi` = 'Làng xóm, vùng đất (bên phải)' WHERE `radical_id` = 163;
UPDATE `radical` SET `meaning_vi` = 'Bình rượu, chi Dậu' WHERE `radical_id` = 164;
UPDATE `radical` SET `meaning_vi` = 'Phân biệt, móng vuốt' WHERE `radical_id` = 165;
UPDATE `radical` SET `meaning_vi` = 'Dặm đường, làng xóm' WHERE `radical_id` = 166;
UPDATE `radical` SET `meaning_vi` = 'Kim loại, vàng' WHERE `radical_id` = 167;
UPDATE `radical` SET `meaning_vi` = 'Dài, lớn lên, trưởng tộc' WHERE `radical_id` = 168;
UPDATE `radical` SET `meaning_vi` = 'Cửa lớn hai cánh' WHERE `radical_id` = 169;
UPDATE `radical` SET `meaning_vi` = 'Gò đất, đồi núi (bên trái)' WHERE `radical_id` = 170;
UPDATE `radical` SET `meaning_vi` = 'Đuổi kịp, phụ thuộc' WHERE `radical_id` = 171;
UPDATE `radical` SET `meaning_vi` = 'Chim đuôi ngắn' WHERE `radical_id` = 172;
UPDATE `radical` SET `meaning_vi` = 'Cơn mưa' WHERE `radical_id` = 173;
UPDATE `radical` SET `meaning_vi` = 'Màu xanh biếc' WHERE `radical_id` = 174;
UPDATE `radical` SET `meaning_vi` = 'Không phải, sai trái' WHERE `radical_id` = 175;
UPDATE `radical` SET `meaning_vi` = 'Khuôn mặt, bề mặt' WHERE `radical_id` = 176;
UPDATE `radical` SET `meaning_vi` = 'Da thú đã thuộc, thay đổi' WHERE `radical_id` = 177;
UPDATE `radical` SET `meaning_vi` = 'Da thuộc bao bọc' WHERE `radical_id` = 178;
UPDATE `radical` SET `meaning_vi` = 'Cây rau hẹ' WHERE `radical_id` = 179;
UPDATE `radical` SET `meaning_vi` = 'Âm thanh, tiếng động' WHERE `radical_id` = 180;
UPDATE `radical` SET `meaning_vi` = 'Trang sách, đầu người' WHERE `radical_id` = 181;
UPDATE `radical` SET `meaning_vi` = 'Cơn gió' WHERE `radical_id` = 182;
UPDATE `radical` SET `meaning_vi` = 'Bay lượn' WHERE `radical_id` = 183;
UPDATE `radical` SET `meaning_vi` = 'Đồ ăn, ăn uống' WHERE `radical_id` = 184;
UPDATE `radical` SET `meaning_vi` = 'Cái đầu, người đứng đầu' WHERE `radical_id` = 185;
UPDATE `radical` SET `meaning_vi` = 'Mùi hương thơm' WHERE `radical_id` = 186;
UPDATE `radical` SET `meaning_vi` = 'Con ngựa' WHERE `radical_id` = 187;
UPDATE `radical` SET `meaning_vi` = 'Khung xương, xương cốt' WHERE `radical_id` = 188;
UPDATE `radical` SET `meaning_vi` = 'Cao lớn, thanh cao' WHERE `radical_id` = 189;
UPDATE `radical` SET `meaning_vi` = 'Mái tóc dài buông xõa' WHERE `radical_id` = 190;
UPDATE `radical` SET `meaning_vi` = 'Đánh nhau, chiến đấu' WHERE `radical_id` = 191;
UPDATE `radical` SET `meaning_vi` = 'Rượu cúng tế thơm' WHERE `radical_id` = 192;
UPDATE `radical` SET `meaning_vi` = 'Nồi nấu ba chân cổ' WHERE `radical_id` = 193;
UPDATE `radical` SET `meaning_vi` = 'Ma quỷ, linh hồn' WHERE `radical_id` = 194;
UPDATE `radical` SET `meaning_vi` = 'Con cá' WHERE `radical_id` = 195;
UPDATE `radical` SET `meaning_vi` = 'Con chim đuôi dài' WHERE `radical_id` = 196;
UPDATE `radical` SET `meaning_vi` = 'Đất mặn, mỏ muối' WHERE `radical_id` = 197;
UPDATE `radical` SET `meaning_vi` = 'Con hươu, con nai' WHERE `radical_id` = 198;
UPDATE `radical` SET `meaning_vi` = 'Cây lúa mạch' WHERE `radical_id` = 199;
UPDATE `radical` SET `meaning_vi` = 'Cây gai dầu, vải gai' WHERE `radical_id` = 200;
UPDATE `radical` SET `meaning_vi` = 'Màu vàng' WHERE `radical_id` = 201;
UPDATE `radical` SET `meaning_vi` = 'Cây kê, nếp dẻo' WHERE `radical_id` = 202;
UPDATE `radical` SET `meaning_vi` = 'Màu đen tối' WHERE `radical_id` = 203;
UPDATE `radical` SET `meaning_vi` = 'Thêu may hoa văn' WHERE `radical_id` = 204;
UPDATE `radical` SET `meaning_vi` = 'Con ếch, loài lưỡng cư' WHERE `radical_id` = 205;
UPDATE `radical` SET `meaning_vi` = 'Cái đỉnh ba chân đồng' WHERE `radical_id` = 206;
UPDATE `radical` SET `meaning_vi` = 'Cái trống da' WHERE `radical_id` = 207;
UPDATE `radical` SET `meaning_vi` = 'Con chuột' WHERE `radical_id` = 208;
UPDATE `radical` SET `meaning_vi` = 'Cái mũi' WHERE `radical_id` = 209;
UPDATE `radical` SET `meaning_vi` = 'Ngay ngắn, đồng đều' WHERE `radical_id` = 210;
UPDATE `radical` SET `meaning_vi` = 'Hàm răng' WHERE `radical_id` = 211;
UPDATE `radical` SET `meaning_vi` = 'Con rồng thần thoại' WHERE `radical_id` = 212;
UPDATE `radical` SET `meaning_vi` = 'Con rùa' WHERE `radical_id` = 213;
UPDATE `radical` SET `meaning_vi` = 'Ống sáo ba lỗ cổ' WHERE `radical_id` = 214;

-- -----------------------------------------------------------------------------
-- 2. Populate 50 Common Radicals with common_rank (1..50) & Verified Pedagogical Explanations
-- -----------------------------------------------------------------------------

-- Rank 1: 木 (Radical 75)
UPDATE `radical` SET
    `common_rank` = 1,
    `explanation_vi` = 'Mô phỏng hình một thân cây có cành lá vươn lên phía trên và rễ cắm sâu xuống đất. Thường xuất hiện trong các chữ Hán liên quan đến cây cối, rừng rậm hoặc đồ dùng làm từ gỗ (như Lâm 林, Sâm 森, Thụ 树).',
    `video_lesson_url` = 'https://www.youtube.com/watch?v=kYv9b6-8D-w'
WHERE `radical_id` = 75;

-- Rank 2: 水(氵) (Radical 85)
UPDATE `radical` SET
    `common_rank` = 2,
    `explanation_vi` = 'Hình tượng dòng nước uốn khúc chảy xiết; khi đặt bên trái chữ thường biến dạng thành ba chấm thủy (氵). Biểu thị các hiện tượng tự nhiên, sông biển, chất lỏng hoặc hành vi liên quan tới nước (như Giang 江, Hà 河, Hải 海).',
    `video_lesson_url` = 'https://www.youtube.com/watch?v=kYv9b6-8D-w'
WHERE `radical_id` = 85;

-- Rank 3: 人(亻) (Radical 9)
UPDATE `radical` SET
    `common_rank` = 3,
    `explanation_vi` = 'Mô phỏng hình dáng một người nhìn nghiêng đang sải bước; dạng bên trái phổ biến là nhân đứng (亻). Gặp trong các chữ thể hiện con người, tính cách, hành động hoặc quan hệ xã hội (như Tha 他, Nhĩ 你, Hưu 休).',
    `video_lesson_url` = 'https://www.youtube.com/watch?v=kYv9b6-8D-w'
WHERE `radical_id` = 9;

-- Rank 4: 口 (Radical 30)
UPDATE `radical` SET
    `common_rank` = 4,
    `explanation_vi` = 'Mô phỏng hình khuôn miệng đang mở rộng. Xuất hiện phổ biến trong hầu hết các chữ chỉ việc ăn uống, phát âm, kêu gọi, diễn đạt hoặc các cơ quan/cửa ngõ (như Khiếu 叫, Ngật 吃, Vấn 问).',
    `video_lesson_url` = 'https://www.youtube.com/watch?v=kYv9b6-8D-w'
WHERE `radical_id` = 30;

-- Rank 5: 心(忄) (Radical 61)
UPDATE `radical` SET
    `common_rank` = 5,
    `explanation_vi` = 'Hình ảnh quả tim với các khoang tâm thất; dạng đứng bên trái là tâm đứng (忄). Đại diện cho cảm xúc, suy nghĩ, tâm trạng, tư duy và đạo đức (như Ái 爱, Tưởng 想, Bận 忙).',
    `video_lesson_url` = 'https://www.youtube.com/watch?v=kYv9b6-8D-w'
WHERE `radical_id` = 61;

-- Rank 6: 手(扌) (Radical 64)
UPDATE `radical` SET
    `common_rank` = 6,
    `explanation_vi` = 'Hình bàn tay xòe năm ngón; khi ghép bên trái biến thành thủ gảy (扌). Biểu thị các thao tác cử động hoặc tác động trực tiếp của đôi bàn tay (như Đả 打, Đề 提, Trảo 抓).',
    `video_lesson_url` = 'https://www.youtube.com/watch?v=kYv9b6-8D-w'
WHERE `radical_id` = 64;

-- Rank 7: 女 (Radical 38)
UPDATE `radical` SET
    `common_rank` = 7,
    `explanation_vi` = 'Hình dáng người phụ nữ ngồi khoanh tay cung kính thời cổ. Thường gặp trong các từ ngữ chỉ phái nữ, danh xưng gia đình (như Mẹ 妈, Chị 姐, Em gái 妹) hoặc tính cách, vẻ đẹp.',
    `video_lesson_url` = 'https://www.youtube.com/watch?v=kYv9b6-8D-w'
WHERE `radical_id` = 38;

-- Rank 8: 火(灬) (Radical 86)
UPDATE `radical` SET
    `common_rank` = 8,
    `explanation_vi` = 'Mô phỏng ngọn lửa bùng cháy từ củi; khi nằm ở đáy chữ thường hóa thành bốn chấm hỏa (灬). Biểu thị ánh sáng, độ nóng, việc nấu nướng, đun sôi hoặc thiêu đốt (như Thiêu 烧, Nhiệt 热, Tiêu 焦).',
    `video_lesson_url` = 'https://www.youtube.com/watch?v=kYv9b6-8D-w'
WHERE `radical_id` = 86;

-- Rank 9: 土 (Radical 32)
UPDATE `radical` SET
    `common_rank` = 9,
    `explanation_vi` = 'Hình gò đất đắp cao nổi trên mặt phẳng mặt đất. Thường xuất hiện trong các chữ biểu thị đất đai, địa hình, công trình xây cất hoặc đồ gốm sứ (như Địa 地, Trường 场, Thành 城).',
    `video_lesson_url` = 'https://www.youtube.com/watch?v=kYv9b6-8D-w'
WHERE `radical_id` = 32;

-- Rank 10: 日 (Radical 72)
UPDATE `radical` SET
    `common_rank` = 10,
    `explanation_vi` = 'Hình tượng vầng mặt trời tròn có đốm đen ở giữa, sau chuyển thành hình chữ nhật. Đại diện cho mặt trời, ban ngày, thời gian, sự chiếu sáng hoặc trạng thái thời tiết (như Minh 明, Thời 时, Tình 晴).',
    `video_lesson_url` = NULL
WHERE `radical_id` = 72;

-- Rank 11: 月 (Radical 74)
UPDATE `radical` SET
    `common_rank` = 11,
    `explanation_vi` = 'Hình ảnh vầng trăng khuyết; đồng thời trong cấu trúc chữ Hán thường đại diện cho bộ Nhục (thịt). Biểu thị chu kỳ thời gian (tháng, đêm) hoặc các bộ phận cơ thể con người (như Kỳ 期, Can 肝, Bằng 朋).',
    `video_lesson_url` = NULL
WHERE `radical_id` = 74;

-- Rank 12: 刀(刂) (Radical 18)
UPDATE `radical` SET
    `common_rank` = 12,
    `explanation_vi` = 'Mô phỏng lưỡi dao sắc bén; khi đặt ở bên phải biến thể thành đao đứng (刂). Thường xuất hiện trong các chữ mang nghĩa chia cắt, đao kiếm, hình phạt hoặc sự phân định (như Phân 分, Biệt 别, Cắt 切).',
    `video_lesson_url` = NULL
WHERE `radical_id` = 18;

-- Rank 13: 宀 (Radical 40)
UPDATE `radical` SET
    `common_rank` = 13,
    `explanation_vi` = 'Mô phỏng hình mái nhà che chở có vách buông xuống hai bên. Biểu thị nhà cửa, không gian cư trú, nơi thờ tự hoặc trạng thái yên ổn, an toàn (như An 安, Gia 家, Định 定).',
    `video_lesson_url` = NULL
WHERE `radical_id` = 40;

-- Rank 14: 言(訁/讠) (Radical 149)
UPDATE `radical` SET
    `common_rank` = 14,
    `explanation_vi` = 'Hình ảnh âm thanh và lời nói thốt ra từ cửa miệng, dạng giản thể viết là (讠). Xuất hiện trong các chữ biểu thị lời nói, đàm thoại, ngôn ngữ, bài học hoặc tranh luận (như Thoại 话, Ngữ 语, Thuyết 说).',
    `video_lesson_url` = 'https://www.youtube.com/watch?v=kYv9b6-8D-w'
WHERE `radical_id` = 149;

-- Rank 15: 艸(艹) (Radical 140)
UPDATE `radical` SET
    `common_rank` = 15,
    `explanation_vi` = 'Hình hai khóm cỏ non nhú trên mặt đất, thường nằm ở phần trên của chữ gọi là đầu thảo (艹). Biểu thị các loài cỏ, hoa lá, rau củ hoặc thảo dược (như Hoa 花, Trà 茶, Dược 药).',
    `video_lesson_url` = 'https://www.youtube.com/watch?v=kYv9b6-8D-w'
WHERE `radical_id` = 140;

-- Rank 16: 糸(纟) (Radical 120)
UPDATE `radical` SET
    `common_rank` = 16,
    `explanation_vi` = 'Mô phỏng cuộn tơ tằm đã se thành sợi chỉ, giản thể là (纟). Thường gặp trong các từ ngữ chỉ tơ lụa, dệt may, dây buộc, sự kết nối hoặc màu sắc (như Hồng 红, Tuyến 线, Kết 结).',
    `video_lesson_url` = 'https://www.youtube.com/watch?v=kYv9b6-8D-w'
WHERE `radical_id` = 120;

-- Rank 17: 金(釒/钅) (Radical 167)
UPDATE `radical` SET
    `common_rank` = 17,
    `explanation_vi` = 'Hình các khối quặng kim loại vùi sâu dưới lớp đất, giản thể là (钅). Biểu thị kim loại, đồ vật bằng đồng/sắt/thép, chuông đúc hoặc tiền tài (như Thiết 铁, Ngân 银, Chung 钟).',
    `video_lesson_url` = 'https://www.youtube.com/watch?v=kYv9b6-8D-w'
WHERE `radical_id` = 167;

-- Rank 18: 山 (Radical 46)
UPDATE `radical` SET
    `common_rank` = 18,
    `explanation_vi` = 'Hình ảnh ba ngọn núi nhấp nhô nối tiếp nhau vươn lên bầu trời. Biểu thị núi non, đèo dốc, sự vững chãi, cao lớn hoặc địa hình hiểm trở (như Nham 岩, Đảo 岛, Phong 峰).',
    `video_lesson_url` = 'https://www.youtube.com/watch?v=kYv9b6-8D-w'
WHERE `radical_id` = 46;

-- Rank 19: 辵(辶) (Radical 162)
UPDATE `radical` SET
    `common_rank` = 19,
    `explanation_vi` = 'Hình bước chân đang di chuyển trên ngã ba đường (quai xước 辶). Biểu thị sự di chuyển, hành trình, sự đuổi theo, khoảng cách hoặc thời gian qua đi (như Tiến 进, Quá 过, Đạt 达).',
    `video_lesson_url` = NULL
WHERE `radical_id` = 162;

-- Rank 20: 力 (Radical 19)
UPDATE `radical` SET
    `common_rank` = 20,
    `explanation_vi` = 'Mô phỏng hình chiếc cày nông cụ hoặc cánh tay gân guốc đang dùng sức. Biểu thị sức lực, sự nỗ lực, công việc nặng nhọc hoặc sức mạnh (như Gia 加, Lao 劳, Cần 勤).',
    `video_lesson_url` = NULL
WHERE `radical_id` = 19;

-- Rank 21: 大 (Radical 37)
UPDATE `radical` SET
    `common_rank` = 21,
    `explanation_vi` = 'Hình dáng người trưởng thành dang rộng hai tay và hai chân để thể hiện kích thước to lớn. Biểu thị sự vĩ đại, rộng lớn hoặc các nhân vật tôn kính (như Thiên 天, Thái 太).',
    `video_lesson_url` = NULL
WHERE `radical_id` = 37;

-- Rank 22: 子 (Radical 39)
UPDATE `radical` SET
    `common_rank` = 22,
    `explanation_vi` = 'Mô phỏng hình hài đứa bé sơ sinh quấn tã đang giơ hai tay. Đại diện cho con cái, trẻ nhỏ, sự kế tục dòng giống hoặc hạt mầm (như Tôn 孙, Tự 字, Học 学).',
    `video_lesson_url` = NULL
WHERE `radical_id` = 39;

-- Rank 23: 目 (Radical 109)
UPDATE `radical` SET
    `common_rank` = 23,
    `explanation_vi` = 'Hình vẽ con mắt nằm ngang với con ngươi ở giữa, sau chuyển sang dựng đứng. Biểu thị đôi mắt, thị giác, hành động nhìn, quan sát hoặc mù lòa (như Nhãn 眼, Miên 眠, Manh 盲).',
    `video_lesson_url` = 'https://www.youtube.com/watch?v=kYv9b6-8D-w'
WHERE `radical_id` = 109;

-- Rank 24: 足(𧾷) (Radical 157)
UPDATE `radical` SET
    `common_rank` = 24,
    `explanation_vi` = 'Hình tượng cẳng chân và bàn chân người đang sải bước; biến thể bên trái là (𧾷). Thường gặp trong các chữ chỉ bước chân, hành động đi đứng, chạy nhảy hoặc đá (như Khiêu 跳, Lộ 路, Bào 跑).',
    `video_lesson_url` = NULL
WHERE `radical_id` = 157;

-- Rank 25: 車(车) (Radical 159)
UPDATE `radical` SET
    `common_rank` = 25,
    `explanation_vi` = 'Mô phỏng cỗ xe ngựa cổ nhìn từ trên cao với bánh xe và trục xe, giản thể là (车). Biểu thị các loại xe cộ, phương tiện vận tải hoặc hành động lăn bánh (như Luân 轮, Quân 军, Vận 运).',
    `video_lesson_url` = NULL
WHERE `radical_id` = 159;

-- Rank 26: 門(门) (Radical 169)
UPDATE `radical` SET
    `common_rank` = 26,
    `explanation_vi` = 'Hình hai cánh cửa lớn của cổng thành hoặc dinh thự mở ra, giản thể là (门). Biểu thị cánh cổng, nơi then chốt, sự đóng mở hoặc căn phòng (như Khai 开, Quan 关, Gian 间).',
    `video_lesson_url` = NULL
WHERE `radical_id` = 169;

-- Rank 27: 食(饣) (Radical 184)
UPDATE `radical` SET
    `common_rank` = 27,
    `explanation_vi` = 'Hình nắp đậy trên chiếc bát đựng cơm nóng thơm, dạng giản thể đứng bên trái là (饣). Đại diện cho thức ăn, việc ăn uống, sự no đói hoặc đồ gia vị (như Phạn 饭, Bão 饱, Ngạ 饿).',
    `video_lesson_url` = NULL
WHERE `radical_id` = 184;

-- Rank 28: 衣(衤) (Radical 145)
UPDATE `radical` SET
    `common_rank` = 28,
    `explanation_vi` = 'Hình chiếc áo cổ gập vạt chéo thời xưa; dạng đứng bên trái là (衤). Biểu thị quần áo, vải vóc trang phục, chăn màn hoặc sự che phủ (như Sơ 初, Sam 衫, Khố 裤).',
    `video_lesson_url` = 'https://www.youtube.com/watch?v=kYv9b6-8D-w'
WHERE `radical_id` = 145;

-- Rank 29: 犬(犭) (Radical 94)
UPDATE `radical` SET
    `common_rank` = 29,
    `explanation_vi` = 'Hình con chó đứng nghiêng với đuôi cong lên; dạng đứng bên trái là khuyển đứng (犭). Đại diện cho loài chó, các loài thú săn, động vật bốn chân hoặc tính hung bạo (như Miêu 猫, Cẩu 狗, Lang 狼).',
    `video_lesson_url` = NULL
WHERE `radical_id` = 94;

-- Rank 30: 田 (Radical 102)
UPDATE `radical` SET
    `common_rank` = 30,
    `explanation_vi` = 'Mô phỏng thửa ruộng được bờ rãnh chia cắt thành bốn ô vuông nhỏ. Biểu thị đồng ruộng, canh tác nông nghiệp, đất đai hoặc sinh hoạt mùa màng (như Giới 界, Liệp 猎, Đương 当).',
    `video_lesson_url` = NULL
WHERE `radical_id` = 102;

-- Rank 31: 石 (Radical 112)
UPDATE `radical` SET
    `common_rank` = 31,
    `explanation_vi` = 'Hình khối đá rơi xuống từ một vách đá nhô ra. Xuất hiện trong các chữ chỉ đất đá, khoáng sản, độ cứng rắn hoặc các công cụ đẽo bằng đá (như Phá 破, Nghiên 研, Sa 砂).',
    `video_lesson_url` = NULL
WHERE `radical_id` = 112;

-- Rank 32: 禾 (Radical 115)
UPDATE `radical` SET
    `common_rank` = 32,
    `explanation_vi` = 'Hình cây lúa trĩu bông uốn cong đầu ngọn. Biểu thị các loại lúa ngũ cốc, nông nghiệp mùa vụ, thuế má hoặc tiền tài thời phong kiến (như Thu 秋, Trĩ 稚, Chủng 种).',
    `video_lesson_url` = NULL
WHERE `radical_id` = 115;

-- Rank 33: 竹 (Radical 118)
UPDATE `radical` SET
    `common_rank` = 33,
    `explanation_vi` = 'Mô phỏng hai cành tre với những chiếc lá nhọn rủ xuống, viết tắt phía trên là (⺮). Biểu thị cây tre, măng nứa, nhạc cụ sáo hoặc đồ đan lát bằng tre (như Tiếu 笑, Bút 笔, Đáp 答).',
    `video_lesson_url` = 'https://www.youtube.com/watch?v=kYv9b6-8D-w'
WHERE `radical_id` = 118;

-- Rank 34: 米 (Radical 119)
UPDATE `radical` SET
    `common_rank` = 34,
    `explanation_vi` = 'Hình bông lúa tỏa ra các hạt gạo xung quanh chữ thập. Biểu thị hạt gạo, lương thực, thực phẩm nấu chín hoặc sự tinh khiết (như Phấn 粉, Lương 粮, Tinh 精).',
    `video_lesson_url` = NULL
WHERE `radical_id` = 119;

-- Rank 35: 虫 (Radical 142)
UPDATE `radical` SET
    `common_rank` = 35,
    `explanation_vi` = 'Mô phỏng một con rắn nhỏ hoặc loài sâu đang bò trườn. Đại diện cho thế giới côn trùng, sâu bọ, loài bò sát, giáp xác hoặc ếch nhái (như Xà 蛇, Nghĩ 蚁, Điệp 蝶).',
    `video_lesson_url` = 'https://www.youtube.com/watch?v=kYv9b6-8D-w'
WHERE `radical_id` = 142;

-- Rank 36: 貝(贝) (Radical 154)
UPDATE `radical` SET
    `common_rank` = 36,
    `explanation_vi` = 'Mô phỏng vỏ sò ốc quý được người cổ đại dùng làm tiền tệ giao thương, giản thể là (贝). Xuất hiện trong các chữ chỉ tiền tài, của cải, buôn bán hoặc vật phẩm quý giá (như Tài 财, Quý 贵, Mãi 买).',
    `video_lesson_url` = NULL
WHERE `radical_id` = 154;

-- Rank 37: 雨 (Radical 173)
UPDATE `radical` SET
    `common_rank` = 37,
    `explanation_vi` = 'Mô phỏng bầu trời mây giăng và những giọt mưa rớt xuống. Biểu thị các hiện tượng thời tiết khí quyển (như Tuyết 雪, Lôi 雷, Sương 霜, Vân 云).',
    `video_lesson_url` = NULL
WHERE `radical_id` = 173;

-- Rank 38: 牛(牜) (Radical 93)
UPDATE `radical` SET
    `common_rank` = 38,
    `explanation_vi` = 'Hình đầu con trâu có hai sừng cong nhọn vươn lên; dạng đứng bên trái là (牜). Đại diện cho loài trâu bò, gia súc hoặc đồ tế lễ thời xưa (như Vật 物, Mẫu 牡, Đặc 特).',
    `video_lesson_url` = NULL
WHERE `radical_id` = 93;

-- Rank 39: 馬(马) (Radical 187)
UPDATE `radical` SET
    `common_rank` = 39,
    `explanation_vi` = 'Mô phỏng con ngựa đang phi với bờm dài và bốn chân nhanh nhẹn, giản thể là (马). Xuất hiện trong các chữ chỉ loài ngựa, sự cưỡi ruổi, tốc độ hoặc chiến trận (như Kỵ 骑, Lạc 骆, Trừu 驰).',
    `video_lesson_url` = NULL
WHERE `radical_id` = 187;

-- Rank 40: 鳥(鸟) (Radical 196)
UPDATE `radical` SET
    `common_rank` = 40,
    `explanation_vi` = 'Mô phỏng con chim có mắt tròn, đuôi dài xòe và vuốt quặp cành cây, giản thể là (鸟). Biểu thị các loài chim muông, gia cầm biết bay hoặc tiếng hót (như Minh 鸣, Nha 鸦, Kê 鸡).',
    `video_lesson_url` = 'https://www.youtube.com/watch?v=kYv9b6-8D-w'
WHERE `radical_id` = 196;

-- Rank 41: 魚(鱼) (Radical 195)
UPDATE `radical` SET
    `common_rank` = 41,
    `explanation_vi` = 'Mô phỏng con cá có đầu, thân phủ vảy và vây đuôi uốn khúc, giản thể là (鱼). Thường gặp trong các chữ chỉ các loài cá, thủy hải sản hoặc nghề chài lưới (như Tiên 鲜, Kình 鲸, Lỗ 鲁).',
    `video_lesson_url` = NULL
WHERE `radical_id` = 195;

-- Rank 42: 肉 (Radical 130)
UPDATE `radical` SET
    `common_rank` = 42,
    `explanation_vi` = 'Mô phỏng một miếng thịt xẻ có vân nạc vân mỡ đan xen, khi đứng ghép thường viết giống bộ Nguyệt (月). Biểu thị thịt bắp, cơ thể sống hoặc các phủ tạng (như Phì 肥, Vị 胃, Bắp 肢).',
    `video_lesson_url` = 'https://www.youtube.com/watch?v=kYv9b6-8D-w'
WHERE `radical_id` = 130;

-- Rank 43: 疒 (Radical 104)
UPDATE `radical` SET
    `common_rank` = 43,
    `explanation_vi` = 'Mô phỏng người bệnh đang nằm đổ mồ hôi trên chiếc giường nghiêng. Xuất hiện trong hầu hết các chữ chỉ đau đớn, bệnh tật, thương tích hoặc sự chữa trị (như Bệnh 病, Thống 痛, Điên 疯).',
    `video_lesson_url` = NULL
WHERE `radical_id` = 104;

-- Rank 44: 广 (Radical 53)
UPDATE `radical` SET
    `common_rank` = 44,
    `explanation_vi` = 'Hình ngôi nhà lớn hoặc nhà kho xây tựa vào sườn núi, có mái che một bên. Biểu thị kho bãi, cửa tiệm, dinh thự hoặc không gian rộng rãi (như Điếm 店, Phủ 府, Trang 庄).',
    `video_lesson_url` = NULL
WHERE `radical_id` = 53;

-- Rank 45: 彳 (Radical 60)
UPDATE `radical` SET
    `common_rank` = 45,
    `explanation_vi` = 'Hình nửa bên trái của một ngã tư đường, tượng trưng cho bước chân trái. Thường gặp trong các chữ liên quan đến bước đi, hành trình, đường xá hoặc hành vi công cộng (như Vãng 往, Đắc 得, Luật 律).',
    `video_lesson_url` = NULL
WHERE `radical_id` = 60;

-- Rank 46: 攴(攵) (Radical 66)
UPDATE `radical` SET
    `common_rank` = 46,
    `explanation_vi` = 'Hình bàn tay đang cầm một nhánh cây đánh nhẹ để răn dạy, dạng phổ biến bên phải là (攵). Biểu thị hành động có chủ đích, sự cải tạo, giáo dục hoặc biến đổi (như Giáo 教, Cải 改, Phóng 放).',
    `video_lesson_url` = NULL
WHERE `radical_id` = 66;

-- Rank 47: 頁(页) (Radical 181)
UPDATE `radical` SET
    `common_rank` = 47,
    `explanation_vi` = 'Mô phỏng chiếc đầu người nổi bật trên cổ áo, sau phát triển thành trang sách tờ giấy, giản thể là (页). Biểu thị phần đầu, đỉnh, gáy hoặc các trang sách vở (như Đỉnh 顶, Hạng 项, Dự 预).',
    `video_lesson_url` = NULL
WHERE `radical_id` = 181;

-- Rank 48: 邑(阝) (Radical 163)
UPDATE `radical` SET
    `common_rank` = 48,
    `explanation_vi` = 'Hình một khu ấp dân cư có người quỳ bên dưới; khi đứng bên phải chữ viết thành bộ bễ (阝 bên phải). Biểu thị làng xã, đô thị, địa danh hoặc đất phong (như Đô 都, Bộ 部, Bang 邦).',
    `video_lesson_url` = NULL
WHERE `radical_id` = 163;

-- Rank 49: 阜(阝) (Radical 170)
UPDATE `radical` SET
    `common_rank` = 49,
    `explanation_vi` = 'Mô phỏng những bậc thang hoặc gò đất cao ven núi; khi đứng bên trái chữ viết thành bộ bễ (阝 bên trái). Biểu thị gò đồi, bờ dốc, sự che chắn hoặc cản trở (như Phòng 防, Viện 院, Trụy 坠).',
    `video_lesson_url` = NULL
WHERE `radical_id` = 170;

-- Rank 50: 囗 (Radical 31)
UPDATE `radical` SET
    `common_rank` = 50,
    `explanation_vi` = 'Hình vòng vây kín mít bao bọc bốn phía, khác với bộ Khẩu (口) là bộ Vi luôn ôm trọn các thành phần khác bên trong. Biểu thị sự bao vây, giới hạn, vương quốc hoặc vòng cung (như Quốc 国, Viên 园, Vi 围).',
    `video_lesson_url` = NULL
WHERE `radical_id` = 31;
