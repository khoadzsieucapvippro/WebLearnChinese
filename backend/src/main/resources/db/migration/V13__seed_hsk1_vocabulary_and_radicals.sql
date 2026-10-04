-- =============================================================================
-- Migration: V13__seed_hsk1_vocabulary_and_radicals.sql
-- Description: Seed authoritative 500 HSK 1 vocabulary entries (HSK 3.0 standard)
--              and 804 Kangxi radical relations (Unicode Unihan kRSUnicode)
-- Database: MySQL 8.4+
-- Charset: utf8mb4, Collation: utf8mb4_unicode_ci
-- =============================================================================

-- 1. Upsert 500 HSK 1 Vocabulary Records
INSERT INTO `VOCABULARY` (
    `hanzi`, `pinyin`, `pinyin_raw`, `meaning_han_viet`, `meaning_vi`,
    `hsk_level`, `hsk_standard`, `example_sentence`, `example_translation`,
    `created_at`, `updated_at`
) VALUES
('爱', 'ài', 'ai', 'Ái', 'Yêu; thích; tình cảm', 1, 'HSK 3.0', '我爱我的家人。', 'Tôi yêu gia đình của tôi.', NOW(), NOW()),
('爱好', 'àihào', 'aihao', 'Ái Hảo', 'Thích; đam mê; lấy làm thú vui; say mê; sở thích', 1, 'HSK 3.0', '我的爱好是听音乐。', 'Sở thích của tôi là nghe nhạc.', NOW(), NOW()),
('八', 'bā', 'ba', 'Bát', 'Tám; 8', 1, 'HSK 3.0', '一个星期有七天，不是八天。', 'Một tuần có bảy ngày, không phải tám ngày.', NOW(), NOW()),
('爸爸', 'bàba', 'baba', 'Ba Ba', 'Cha; ba', 1, 'HSK 3.0', '我爸爸是一名医生。', 'Bố tôi là một bác sĩ.', NOW(), NOW()),
('吧', 'ba', 'ba', 'Ba', 'Trợ từ ngữ khí: nhé, thôi, đi, chứ', 1, 'HSK 3.0', '我们一起走吧。', 'Chúng ta cùng đi thôi nào.', NOW(), NOW()),
('白', 'bái', 'bai', 'Bạch', 'Màu trắng; trắng', 1, 'HSK 3.0', '这件白色的衣服很好看。', 'Chiếc áo màu trắng này rất đẹp.', NOW(), NOW()),
('白天', 'báitiān', 'baitian', 'Bạch Thiên', 'Ban ngày; trong ngày', 1, 'HSK 3.0', '白天他在学校学习。', 'Ban ngày anh ấy học ở trường.', NOW(), NOW()),
('百', 'bǎi', 'bai', 'Bách', 'Một trăm; trăm', 1, 'HSK 3.0', '这本书有一百页。', 'Cuốn sách này có một trăm trang.', NOW(), NOW()),
('班', 'bān', 'ban', 'Ban', 'Lớp học; ca làm việc', 1, 'HSK 3.0', '我们班有二十个学生。', 'Lớp chúng tôi có hai mươi học sinh.', NOW(), NOW()),
('半', 'bàn', 'ban', 'Bán', 'Một nửa; bán-', 1, 'HSK 3.0', '现在是三点半。', 'Bây giờ là ba rưỡi.', NOW(), NOW()),
('半年', 'bàn nián', 'ban nian', 'Bán Niên', 'Nửa năm', 1, 'HSK 3.0', '他在中国住了半年。', 'Anh ấy đã sống ở Trung Quốc nửa năm.', NOW(), NOW()),
('半天', 'bàntiān', 'bantian', 'Bán Thiên', 'Nửa ngày; một thời gian dài', 1, 'HSK 3.0', '我等了你半天。', 'Tôi đã đợi bạn cả buổi trời.', NOW(), NOW()),
('帮', 'bāng', 'bang', 'Bang', 'Giúp; giúp đỡ', 1, 'HSK 3.0', '请帮我一下。', 'Xin hãy giúp tôi một chút.', NOW(), NOW()),
('帮忙', 'bāngmáng', 'bangmang', 'Bang Mang', 'Giúp; giúp đỡ', 1, 'HSK 3.0', '谢谢你帮我的忙。', 'Cảm ơn bạn đã giúp đỡ tôi.', NOW(), NOW()),
('包', 'bāo', 'bao', 'Bao', 'Túi; bao; gói', 1, 'HSK 3.0', '这个包里有很多东西。', 'Trong chiếc túi này có rất nhiều đồ.', NOW(), NOW()),
('包子', 'bāozi', 'baozi', 'Bao Tử', 'Bánh bao', 1, 'HSK 3.0', '中国人喜欢吃包子。', 'Người Trung Quốc thích ăn bánh bao.', NOW(), NOW()),
('杯', 'bēi', 'bei', 'Bôi', 'Cốc; ly; chén', 1, 'HSK 3.0', '我喝了一杯水。', 'Tôi đã uống một cốc nước.', NOW(), NOW()),
('杯子', 'bēizi', 'beizi', 'Bôi Tử', 'Cốc; ly', 1, 'HSK 3.0', '桌子上有一个杯子。', 'Trên bàn có một chiếc cốc.', NOW(), NOW()),
('北', 'běi', 'bei', 'Bắc', 'Phía bắc; bị đánh bại', 1, 'HSK 3.0', '我家在学校的北边。', 'Nhà tôi ở phía bắc trường học.', NOW(), NOW()),
('北边', 'běibian', 'beibian', 'Bắc Biên', 'Phía bắc; mặt bắc', 1, 'HSK 3.0', '公园在北边。', 'Công viên ở phía bắc.', NOW(), NOW()),
('北京', 'Běijīng', 'beijing', 'Bắc Kinh', 'Bắc Kinh, thủ đô nước Cộng hòa Nhân dân Trung Hoa', 1, 'HSK 3.0', '我想去北京旅游。', 'Tôi muốn đi Bắc Kinh du lịch.', NOW(), NOW()),
('本', 'běn', 'ben', 'Bản', 'Quyển; cuốn (sách); gốc', 1, 'HSK 3.0', '我买了两本书。', 'Tôi đã mua hai cuốn sách.', NOW(), NOW()),
('本子', 'běnzi', 'benzi', 'Bản Tử', 'Sách; quyển tập', 1, 'HSK 3.0', '这是一个新本子。', 'Đây là một quyển vở mới.', NOW(), NOW()),
('比', 'bǐ', 'bi', 'Tỷ', 'So sánh; so với; hơn', 1, 'HSK 3.0', '今天比昨天冷。', 'Hôm nay lạnh hơn hôm qua.', NOW(), NOW()),
('别', 'bié', 'bie', 'Biệt', 'Đừng; chớ; khác', 1, 'HSK 3.0', '别说话，请听老师讲。', 'Đừng nói chuyện, hãy nghe thầy giảng.', NOW(), NOW()),
('别的', 'biéde', 'biede', 'Biệt Đích', 'Khác', 1, 'HSK 3.0', '你还需要别的吗？', 'Bạn còn cần thứ khác không?', NOW(), NOW()),
('别人', 'biérén', 'bieren', 'Biệt Nhân', 'Người khác; những người khác', 1, 'HSK 3.0', '我们要学会尊重别人。', 'Chúng ta phải học cách tôn trọng người khác.', NOW(), NOW()),
('病', 'bìng', 'bing', 'Bệnh', 'Bệnh; ốm đau', 1, 'HSK 3.0', '他生病了，在医院看病。', 'Anh ấy bị bệnh rồi, đang khám ở bệnh viện.', NOW(), NOW()),
('病人', 'bìngrén', 'bingren', 'Bệnh Nhân', 'Người bệnh; bệnh nhân', 1, 'HSK 3.0', '医生正在照顾病人。', 'Bác sĩ đang chăm sóc bệnh nhân.', NOW(), NOW()),
('不大', 'bù dà', 'bu da', 'Bất Đại', 'Không quá; không nhiều', 1, 'HSK 3.0', '这个房间不大。', 'Căn phòng này không lớn.', NOW(), NOW()),
('不对', 'bùduì', 'budui', 'Bất Đối', 'Không chính xác; sai', 1, 'HSK 3.0', '这个答案不对。', 'Đáp án này không đúng.', NOW(), NOW()),
('不客气', 'bù kèqì', 'bu keqi', 'Bất Khách Khí', 'Không có chi; đừng nhắc đến', 1, 'HSK 3.0', '不客气，这是我应该做的。', 'Không có chi, đây là việc tôi nên làm.', NOW(), NOW()),
('不用', 'bùyòng', 'buyong', 'Bất Dụng', 'Không cần', 1, 'HSK 3.0', '不用客气，这是我应该做的。', 'Không cần khách sáo, đây là điều tôi nên làm.', NOW(), NOW()),
('不', 'bù', 'bu', 'Bất', 'Không; không phải; không; bất-', 1, 'HSK 3.0', '我不喝茶，我喝水。', 'Tôi không uống trà, tôi uống nước.', NOW(), NOW()),
('菜', 'cài', 'cai', 'Thái', 'Rau; món ăn', 1, 'HSK 3.0', '中国菜很好吃。', 'Món ăn Trung Quốc rất ngon.', NOW(), NOW()),
('茶', 'chá', 'cha', 'Trà', 'Trà; cây trà', 1, 'HSK 3.0', '中国人喜欢喝茶。', 'Người Trung Quốc thích uống trà.', NOW(), NOW()),
('差', 'chà', 'cha', 'Sai', 'Sự khác biệt; không nhất quán; hiệu số', 1, 'HSK 3.0', '现在差五分八点。', 'Bây giờ là tám giờ kém năm.', NOW(), NOW()),
('常', 'cháng', 'chang', 'Thường', 'Thường; thường xuyên', 1, 'HSK 3.0', '我常去图书馆看书。', 'Tôi thường đến thư viện đọc sách.', NOW(), NOW()),
('常常', 'chángcháng', 'changchang', 'Thường Thường', 'Thường xuyên; thường', 1, 'HSK 3.0', '周末我常常和朋友聚会。', 'Cuối tuần tôi thường tụ tập với bạn bè.', NOW(), NOW()),
('唱', 'chàng', 'chang', 'Xướng', 'Hát; gọi to', 1, 'HSK 3.0', '大家一起唱歌吧。', 'Mọi người cùng nhau hát bài hát nào.', NOW(), NOW()),
('唱歌', 'chànggē', 'changge', 'Xướng Ca', 'Hát một bài hát', 1, 'HSK 3.0', '我妹妹很喜欢唱歌。', 'Em gái tôi rất thích ca hát.', NOW(), NOW()),
('车', 'chē', 'che', 'Xa', 'Họ', 1, 'HSK 3.0', '路上有很多车。', 'Trên đường có rất nhiều xe cộ.', NOW(), NOW()),
('车票', 'chēpiào', 'chepiao', 'Xa Phiếu', 'Vé', 1, 'HSK 3.0', '我买了去北京的车票。', 'Tôi đã mua vé xe đi Bắc Kinh.', NOW(), NOW()),
('车上', 'chē shang', 'che shang', 'Xa Thướng', 'Trên xe', 1, 'HSK 3.0', '车上有很多乘客。', 'Trên xe có rất nhiều hành khách.', NOW(), NOW()),
('车站', 'chēzhàn', 'chezhan', 'Xa Trạm', 'Ga tàu; dừng xe buýt', 1, 'HSK 3.0', '我们在火车站见。', 'Chúng ta gặp nhau ở nhà ga nhé.', NOW(), NOW()),
('吃', 'chī', 'chi', 'Cật', 'Ăn; tiêu thụ; ăn ở', 1, 'HSK 3.0', '你想吃什么？', 'Bạn muốn ăn gì?', NOW(), NOW()),
('吃饭', 'chīfàn', 'chifan', 'Cật Phạn', 'Dùng bữa; ăn', 1, 'HSK 3.0', '我们十二点去吃饭。', 'Mười hai giờ chúng tôi đi ăn cơm.', NOW(), NOW()),
('出', 'chū', 'chu', 'Xuất', 'Ra; xuất; đi ra', 1, 'HSK 3.0', '他从房间里走出来了。', 'Anh ấy từ trong phòng bước ra rồi.', NOW(), NOW()),
('出来', 'chūlái', 'chulai', 'Xuất Lai', 'Đi ra; xuất hiện', 1, 'HSK 3.0', '快出来看雪！', 'Mau ra ngoài xem tuyết rơi nào!', NOW(), NOW()),
('出去', 'chūqù', 'chuqu', 'Xuất Khứ', 'Đi ra ngoài', 1, 'HSK 3.0', '外面下雨了，不要出去。', 'Bên ngoài trời mưa rồi, đừng đi ra ngoài.', NOW(), NOW()),
('穿', 'chuān', 'chuan', 'Xuyên', 'Mặc (áo); đi (giày)', 1, 'HSK 3.0', '今天很冷，多穿点衣服。', 'Hôm nay rất lạnh, hãy mặc nhiều áo một chút.', NOW(), NOW()),
('床', 'chuáng', 'chuang', 'Sàng', 'Giường; ghế dài', 1, 'HSK 3.0', '房间里有一张大床。', 'Trong phòng có một chiếc giường lớn.', NOW(), NOW()),
('次', 'cì', 'ci', 'Thứ', 'Tiếp theo; thứ hai', 1, 'HSK 3.0', '这是我第一次来这里。', 'Đây là lần đầu tiên tôi đến đây.', NOW(), NOW()),
('从', 'cóng', 'cong', 'Tòng', 'Biến thể của 從|从', 1, 'HSK 3.0', '我从越南来到中国。', 'Tôi từ Việt Nam đến Trung Quốc.', NOW(), NOW()),
('错', 'cuò', 'cuo', 'Thác', 'Sai; nhầm lẫn', 1, 'HSK 3.0', '你说得没错。', 'Bạn nói không sai.', NOW(), NOW()),
('打', 'dǎ', 'da', 'Tá', 'Đánh; gọi (điện thoại); chơi (bóng)', 1, 'HSK 3.0', '我们下午去打篮球吧。', 'Chiều nay chúng ta đi chơi bóng rổ nhé.', NOW(), NOW()),
('打车', 'dǎchē', 'dache', 'Tá Xa', 'Bắt taxi; đón xe', 1, 'HSK 3.0', '外面下雨了，我们打车走吧。', 'Bên ngoài trời mưa rồi, chúng ta bắt taxi đi thôi.', NOW(), NOW()),
('打电话', 'dǎ diànhuà', 'da dianhua', 'Tá Điện Thoại', 'Gọi điện thoại', 1, 'HSK 3.0', '他正在给妈妈打电话。', 'Anh ấy đang gọi điện thoại cho mẹ.', NOW(), NOW()),
('打开', 'dǎkāi', 'dakai', 'Tá Khai', 'Mở; cho xem', 1, 'HSK 3.0', '请打开书本。', 'Xin hãy mở sách ra.', NOW(), NOW()),
('打球', 'dǎ qiú', 'da qiu', 'Tá Cầu', 'Chơi bóng; chơi với bóng', 1, 'HSK 3.0', '周末我喜欢和朋友打球。', 'Cuối tuần tôi thích chơi bóng cùng bạn bè.', NOW(), NOW()),
('大', 'dà', 'da', 'Đại', 'Lớn; to', 1, 'HSK 3.0', '这个西瓜很大。', 'Quả dưa hấu này rất to.', NOW(), NOW()),
('大学', 'dàxué', 'daxue', 'Đại Học', 'Đại học, một trong Tứ thư 四書|四书 của Nho giáo', 1, 'HSK 3.0', '他是北京大学的学生。', 'Anh ấy là sinh viên Đại học Bắc Kinh.', NOW(), NOW()),
('大学生', 'dàxuéshēng', 'daxuesheng', 'Đại Học Sinh', 'Sinh viên đại học; sinh viên cao đẳng', 1, 'HSK 3.0', '我的哥哥是一名大学生。', 'Anh trai tôi là một sinh viên đại học.', NOW(), NOW()),
('到', 'dào', 'dao', 'Đáo', 'Đến; tới', 1, 'HSK 3.0', '我们到了火车站。', 'Chúng tôi đã đến ga xe lửa rồi.', NOW(), NOW()),
('得到', 'dédào', 'dedao', 'Đắc Đáo', 'Được; đạt được; nhận được', 1, 'HSK 3.0', '他得到了一份好工作。', 'Anh ấy đã nhận được một công việc tốt.', NOW(), NOW()),
('地', 'de', 'de', 'Địa', 'Đất; mặt đất; trợ từ trạng ngữ', 1, 'HSK 3.0', '地上有一本书。', 'Trên mặt đất có một quyển sách.', NOW(), NOW()),
('的', 'de', 'de', 'Đích', 'Của; trợ từ sở hữu hoặc bổ nghĩa', 1, 'HSK 3.0', '这是我的汉语书。', 'Đây là sách tiếng Trung của tôi.', NOW(), NOW()),
('等', 'děng', 'deng', 'Đẳng', 'Đợi; chờ đợi; vân vân', 1, 'HSK 3.0', '请等我五分钟。', 'Xin hãy đợi tôi năm phút.', NOW(), NOW()),
('地', 'dì', 'di', 'Địa', 'Đất; mặt đất; trợ từ trạng ngữ', 1, 'HSK 3.0', '地上有一本书。', 'Trên mặt đất có một quyển sách.', NOW(), NOW()),
('地点', 'dìdiǎn', 'didian', 'Địa Điểm', 'Nơi; chỗ', 1, 'HSK 3.0', '开会的地点在二楼。', 'Địa điểm họp ở tầng hai.', NOW(), NOW()),
('地方', 'dìfang', 'difang', 'Địa Phương', 'Khu vực; mang tính khu vực', 1, 'HSK 3.0', '这是一个美丽的地方。', 'Đây là một nơi tươi đẹp.', NOW(), NOW()),
('地上', 'dìshang', 'dishang', 'Địa Thướng', 'Trên mặt đất; trên sàn nhà', 1, 'HSK 3.0', '地上有很多落叶。', 'Dưới đất có rất nhiều lá rụng.', NOW(), NOW()),
('地图', 'dìtú', 'ditu', 'Địa Đồ', 'Bản đồ', 1, 'HSK 3.0', '请在地图上找一下这个城市。', 'Xin hãy tìm thành phố này trên bản đồ.', NOW(), NOW()),
('弟弟', 'dìdi', 'didi', 'Đệ Đệ', 'Em trai', 1, 'HSK 3.0', '我弟弟今年十岁。', 'Em trai tôi năm nay mười tuổi.', NOW(), NOW()),
('第', 'dì (dì-èr)', 'di (di-er)', 'Đệ', 'Thứ hạng mà thí sinh đỗ đạt trong kỳ thi đình được xếp vào; nơi ở của quan chức cao cấp', 1, 'HSK 3.0', '他是第一个到教室的人。', 'Anh ấy là người đầu tiên đến lớp học.', NOW(), NOW()),
('点', 'diǎn', 'dian', 'Điểm', 'Giờ; điểm; chấm; chút ít', 1, 'HSK 3.0', '现在是早上八点。', 'Bây giờ là tám giờ sáng.', NOW(), NOW()),
('电', 'diàn', 'dian', 'Điện', 'Điện; pin', 1, 'HSK 3.0', '手机没有电了。', 'Điện thoại hết pin rồi.', NOW(), NOW()),
('电话', 'diànhuà', 'dianhua', 'Điện Thoại', 'Điện thoại; cuộc gọi điện thoại', 1, 'HSK 3.0', '请告诉我你的电话号码。', 'Xin hãy cho tôi biết số điện thoại của bạn.', NOW(), NOW()),
('电脑', 'diànnǎo', 'diannao', 'Điện Não', 'Máy tính', 1, 'HSK 3.0', '我买了一台新电脑。', 'Tôi đã mua một chiếc máy tính mới.', NOW(), NOW()),
('电视', 'diànshì', 'dianshi', 'Điện Thị', 'Truyền hình; TV', 1, 'HSK 3.0', '晚上我们一家人看电视。', 'Buổi tối cả nhà chúng tôi cùng xem ti vi.', NOW(), NOW()),
('电视机', 'diànshìjī', 'dianshiji', 'Điện Thị Cơ', 'Máy thu hình', 1, 'HSK 3.0', '客厅里有一台大电视机。', 'Trong phòng khách có một chiếc ti vi lớn.', NOW(), NOW()),
('电影', 'diànyǐng', 'dianying', 'Điện Ảnh', 'Phim; điện ảnh', 1, 'HSK 3.0', '明天我们去看电影吧。', 'Ngày mai chúng ta đi xem phim nhé.', NOW(), NOW()),
('电影院', 'diànyǐngyuàn', 'dianyingyuan', 'Điện Ảnh Viện', 'Rạp chiếu phim; rạp phim', 1, 'HSK 3.0', '电影院在商场三楼。', 'Rạp chiếu phim ở tầng ba trung tâm thương mại.', NOW(), NOW()),
('东', 'dōng', 'dong', 'Đông', 'Họ', 1, 'HSK 3.0', '太阳从东方升起。', 'Mặt trời mọc từ hướng đông.', NOW(), NOW()),
('东边', 'dōngbian', 'dongbian', 'Đông Biên', 'Hướng đông; phía đông', 1, 'HSK 3.0', '学校东边有一家书店。', 'Phía đông trường học có một hiệu sách.', NOW(), NOW()),
('东西', 'dōngxi', 'dongxi', 'Đông Tây', 'Đông và tây', 1, 'HSK 3.0', '桌子上放着很多东西。', 'Trên bàn đặt rất nhiều đồ đạc.', NOW(), NOW()),
('动', 'dòng', 'dong', 'Động', 'Động; cử động; chuyển động', 1, 'HSK 3.0', '别动，让我看看。', 'Đừng cử động, để tôi xem nào.', NOW(), NOW()),
('动作', 'dòngzuò', 'dongzuo', 'Động Tác', 'Chuyển động; cử động; hành động; diễn; di chuyển', 1, 'HSK 3.0', '他的动作很快。', 'Động tác của anh ấy rất nhanh nhẹn.', NOW(), NOW()),
('都', 'dōu', 'dou', 'Đô', 'Đều; tất cả', 1, 'HSK 3.0', '我们都是学习汉语的学生。', 'Chúng tôi đều là những học sinh học tiếng Trung.', NOW(), NOW()),
('读', 'dú', 'du', 'Đậu', 'Đọc; học tập', 1, 'HSK 3.0', '请大声读这段课文。', 'Xin hãy đọc to đoạn bài khóa này.', NOW(), NOW()),
('读书', 'dúshū', 'dushu', 'Đậu Thư', 'Đọc sách; học', 1, 'HSK 3.0', '他每天晚上都认真读书。', 'Mỗi tối anh ấy đều chăm chỉ đọc sách.', NOW(), NOW()),
('对', 'duì', 'dui', 'Đối', 'Đúng; chính xác; đối với', 1, 'HSK 3.0', '你回答得非常对。', 'Bạn trả lời rất chính xác.', NOW(), NOW()),
('对不起', 'duìbuqǐ', 'duibuqi', 'Đối Bất Khởi', 'Tôi xin lỗi; xin thứ lỗi; tôi xin tha thứ; làm  thất vọng; không đạt kỳ vọng', 1, 'HSK 3.0', '对不起，我来晚了。', 'Xin lỗi, tôi đến muộn.', NOW(), NOW()),
('多', 'duō', 'duo', 'Đa', 'Nhiều', 1, 'HSK 3.0', '学校里有很多学生。', 'Trong trường có rất nhiều học sinh.', NOW(), NOW()),
('多少', 'duōshao', 'duoshao', 'Đa Thiểu', 'Số lượng; mức độ; phần nào', 1, 'HSK 3.0', '请问这个西瓜多少钱？', 'Xin hỏi quả dưa hấu này bao nhiêu tiền?', NOW(), NOW()),
('饿', 'è', 'e', 'Ngạ', 'Đói; làm cho đói', 1, 'HSK 3.0', '我肚子饿了，想吃东西。', 'Bụng tôi đói rồi, muốn ăn gì đó.', NOW(), NOW()),
('儿子', 'érzi', 'erzi', 'Nhân Tử', 'Con trai', 1, 'HSK 3.0', '他的儿子很聪明。', 'Con trai của anh ấy rất thông minh.', NOW(), NOW()),
('二', 'èr', 'er', 'Nhị', 'Hai; 2', 1, 'HSK 3.0', '一加一等于二。', 'Một cộng một bằng hai.', NOW(), NOW()),
('饭', 'fàn', 'fan', 'Phạn', 'Cơm đã nấu; bữa ăn', 1, 'HSK 3.0', '今天的米饭很香。', 'Cơm hôm nay rất thơm ngon.', NOW(), NOW()),
('饭店', 'fàndiàn', 'fandian', 'Phạn Điếm', 'Nhà hàng; khách sạn', 1, 'HSK 3.0', '我们在饭店吃晚饭。', 'Chúng tôi ăn tối ở nhà hàng.', NOW(), NOW()),
('房间', 'fángjiān', 'fangjian', 'Phòng Gian', 'Phòng', 1, 'HSK 3.0', '我的房间很干净。', 'Phòng của tôi rất sạch sẽ.', NOW(), NOW()),
('房子', 'fángzi', 'fangzi', 'Phòng Tử', 'Nhà; tòa nhà', 1, 'HSK 3.0', '他们买了一套新房子。', 'Họ đã mua một ngôi nhà mới.', NOW(), NOW()),
('放', 'fàng', 'fang', 'Phóng', 'Đặt; để; buông; thả', 1, 'HSK 3.0', '请把书放在桌子上。', 'Xin hãy để sách lên bàn.', NOW(), NOW()),
('放假', 'fàngjià', 'fangjia', 'Phóng Giả', 'Nghỉ lễ hoặc kỳ nghỉ', 1, 'HSK 3.0', '下周我们放假三天。', 'Tuần tới chúng tôi được nghỉ ba ngày.', NOW(), NOW()),
('放学', 'fàngxué', 'fangxue', 'Phóng Học', 'Tan học', 1, 'HSK 3.0', '下午五点学生们放学。', 'Năm giờ chiều học sinh tan học.', NOW(), NOW()),
('飞', 'fēi', 'fei', 'Phi', 'Bay', 1, 'HSK 3.0', '小鸟在天空中飞。', 'Chim non đang bay lượn trên bầu trời.', NOW(), NOW()),
('飞机', 'fēijī', 'feiji', 'Phi Cơ', 'Máy bay', 1, 'HSK 3.0', '我坐飞机去北京。', 'Tôi đi máy bay đến Bắc Kinh.', NOW(), NOW()),
('非常', 'fēicháng', 'feichang', 'Phi Thường', 'Rất; thực sự; khác thường; phi thường', 1, 'HSK 3.0', '这本书非常有意思。', 'Cuốn sách này vô cùng thú vị.', NOW(), NOW()),
('分', 'fēn', 'fen', 'Phân', 'Phút; điểm; phân chia', 1, 'HSK 3.0', '现在是八点十分。', 'Bây giờ là tám giờ mười phút.', NOW(), NOW()),
('风', 'fēng', 'feng', 'Phong', 'Gió; tin tức', 1, 'HSK 3.0', '今天外面的风很大。', 'Hôm nay gió ngoài trời rất to.', NOW(), NOW()),
('干', 'gān', 'gan', 'Can', 'Làm; khô ráo', 1, 'HSK 3.0', '衣服已经晾干了。', 'Quần áo đã phơi khô rồi.', NOW(), NOW()),
('干净', 'gānjìng', 'ganjing', 'Can Tịnh', 'Sạch; gọn gàng', 1, 'HSK 3.0', '这个教室真干净。', 'Lớp học này thật sạch sẽ.', NOW(), NOW()),
('干', 'gàn', 'gan4', 'Can', 'Làm; khô ráo', 1, 'HSK 3.0', '衣服已经晾干了。', 'Quần áo đã phơi khô rồi.', NOW(), NOW()),
('干什么', 'gàn shénme', 'gan shenme', 'Can Thậm Yêu', 'Bạn đang làm gì?; anh ấy đang định làm gì?', 1, 'HSK 3.0', '你在房间里干什么呢？', 'Bạn đang làm gì trong phòng thế?', NOW(), NOW()),
('高', 'gāo', 'gao', 'Cao', 'Cao', 1, 'HSK 3.0', '他长得很高。', 'Anh ấy lớn lên rất cao.', NOW(), NOW()),
('高兴', 'gāoxìng', 'gaoxing', 'Cao Hưng', 'Vui; vui vẻ', 1, 'HSK 3.0', '见到你我很高兴。', 'Gặp được bạn tôi rất vui mừng.', NOW(), NOW()),
('告诉', 'gàosu', 'gaosu', 'Cáo Tố', 'Khởi kiện; nộp đơn khiếu nại', 1, 'HSK 3.0', '请告诉我发生什么事了。', 'Xin hãy nói cho tôi biết đã xảy ra chuyện gì.', NOW(), NOW()),
('哥哥', 'gēge', 'gege', 'Ca Ca', 'Anh trai', 1, 'HSK 3.0', '我哥哥在大学读书。', 'Anh trai tôi đang học ở trường đại học.', NOW(), NOW()),
('歌', 'gē', 'ge', 'Ca', 'Bài hát; hát', 1, 'HSK 3.0', '这首歌真好听。', 'Bài hát này thật hay.', NOW(), NOW()),
('个', 'gè', 'ge', 'Cá', 'Cái; quả; con; lượng từ chung', 1, 'HSK 3.0', '我买了一个苹果。', 'Tôi đã mua một quả táo.', NOW(), NOW()),
('给', 'gěi', 'gei', 'Cấp', 'Cho; đưa cho', 1, 'HSK 3.0', '请给我一杯水。', 'Xin cho tôi một cốc nước.', NOW(), NOW()),
('跟', 'gēn', 'gen', 'Cân', 'Cùng; với; theo', 1, 'HSK 3.0', '我想跟你一起去。', 'Tôi muốn đi cùng với bạn.', NOW(), NOW()),
('工人', 'gōngrén', 'gongren', 'Công Nhân', 'Công nhân; Lượng từ: 個|个, 名', 1, 'HSK 3.0', '工厂里有很多工人。', 'Trong nhà máy có rất nhiều công nhân.', NOW(), NOW()),
('工作', 'gōngzuò', 'gongzuo', 'Công Tác', 'Làm việc; vận hành', 1, 'HSK 3.0', '他在医院工作。', 'Anh ấy làm việc ở bệnh viện.', NOW(), NOW()),
('关', 'guān', 'guan', 'Quan', 'Đóng; tắt; quan hệ', 1, 'HSK 3.0', '请关上门。', 'Xin hãy đóng cửa lại.', NOW(), NOW()),
('关上', 'guānshang', 'guanshang', 'Quan Thướng', 'Đóng; tắt', 1, 'HSK 3.0', '离开前请关上灯。', 'Trước khi rời đi xin hãy tắt đèn.', NOW(), NOW()),
('贵', 'guì', 'gui', 'Quý', 'Đắt; được coi trọng; quý giá', 1, 'HSK 3.0', '这件衣服有点贵。', 'Chiếc áo này hơi đắt một chút.', NOW(), NOW()),
('国', 'guó', 'guo', 'Quốc', 'Họ', 1, 'HSK 3.0', '中国是一个历史悠久的国度。', 'Trung Quốc là một quốc gia có lịch sử lâu đời.', NOW(), NOW()),
('国家', 'guójiā', 'guojia', 'Quốc Gia', 'Quốc gia; dân tộc; nhà nước', 1, 'HSK 3.0', '世界上有很多国家。', 'Trên thế giới có rất nhiều quốc gia.', NOW(), NOW()),
('国外', 'guó wài', 'guo wai', 'Quốc Ngoại', 'Ở nước ngoài; ngoại', 1, 'HSK 3.0', '他打算去国外留学。', 'Anh ấy dự định ra nước ngoài du học.', NOW(), NOW()),
('过', 'guò', 'guo', 'Quá', 'Qua; qua đi; từng (kinh nghiệm)', 1, 'HSK 3.0', '你去过中国吗？', 'Bạn đã từng đến Trung Quốc chưa?', NOW(), NOW()),
('还', 'hái', 'hai', 'Hoàn', 'Vẫn; còn; trả lại', 1, 'HSK 3.0', '我吃饱了，还想喝点水。', 'Tôi ăn no rồi, vẫn muốn uống chút nước.', NOW(), NOW()),
('还是', 'háishi', 'haishi', 'Hoàn Thị', 'Vẫn; nên', 1, 'HSK 3.0', '你喝茶还是喝咖啡？', 'Bạn uống trà hay là uống cà phê?', NOW(), NOW()),
('还有', 'hái yǒu', 'hai you', 'Hoàn Hữu', 'Vẫn còn; còn có; thêm vào đó', 1, 'HSK 3.0', '桌上有书，还有笔。', 'Trên bàn có sách, và còn có bút nữa.', NOW(), NOW()),
('孩子', 'háizi', 'haizi', 'Hài Tử', 'Trẻ em', 1, 'HSK 3.0', '孩子们在操场上玩。', 'Lũ trẻ đang chơi đùa trên sân tập.', NOW(), NOW()),
('汉语', 'Hànyǔ', 'hanyu', 'Hán Ngữ', 'Ngôn ngữ tiếng Trung', 1, 'HSK 3.0', '学汉语很有趣。', 'Học tiếng Trung rất thú vị.', NOW(), NOW()),
('汉字', 'Hànzì', 'hanzi', 'Hán Tự', 'Chữ Hán; Nhật: kanji', 1, 'HSK 3.0', '这个汉字很好写。', 'Chữ Hán này rất dễ viết.', NOW(), NOW()),
('好', 'hǎo', 'hao', 'Hảo', 'Tốt; đẹp; xong', 1, 'HSK 3.0', '今天天气真好。', 'Hôm nay thời tiết thật đẹp.', NOW(), NOW()),
('好吃', 'hǎochī', 'haochi', 'Hảo Cật', 'Ngon; ngon miệng', 1, 'HSK 3.0', '妈妈做的菜真好吃。', 'Món ăn mẹ nấu thật là ngon.', NOW(), NOW()),
('好看', 'hǎokàn', 'haokan', 'Hảo Khán', 'Ưa nhìn; xinh đẹp', 1, 'HSK 3.0', '这部电影很好看。', 'Bộ phim này xem rất hay.', NOW(), NOW()),
('好听', 'hǎotīng', 'haoting', 'Hảo Dẫn', 'Nghe hay', 1, 'HSK 3.0', '这首音乐真好听。', 'Bản nhạc này thật là hay.', NOW(), NOW()),
('好玩儿', 'hǎowánr', 'haowanr', 'Hảo Ngoạn Nhân', 'Biến thể er hoá của 好玩', 1, 'HSK 3.0', '这个公园真好玩儿。', 'Công viên này thật vui vẻ.', NOW(), NOW()),
('号', 'hào', 'hao', 'Hiệu', 'Số; ngày (trong tháng)', 1, 'HSK 3.0', '今天是十月一号。', 'Hôm nay là ngày một tháng mười.', NOW(), NOW()),
('喝', 'hē', 'he', 'Húp', 'Uống', 1, 'HSK 3.0', '请喝热茶。', 'Xin mời uống trà nóng.', NOW(), NOW()),
('和', 'hé', 'he', 'Hoà', 'Và; cùng với; hòa thuận', 1, 'HSK 3.0', '我和他是好朋友。', 'Tôi và anh ấy là bạn tốt của nhau.', NOW(), NOW()),
('很', 'hěn', 'hen', 'Ngận', 'Rất; lắm', 1, 'HSK 3.0', '我今天很高兴。', 'Hôm nay tôi rất vui.', NOW(), NOW()),
('后', 'hòu', 'hou', 'Hậu', 'Sau; phía sau', 1, 'HSK 3.0', '三天后我们再见面。', 'Ba ngày sau chúng ta lại gặp nhau.', NOW(), NOW()),
('后边', 'hòubian', 'houbian', 'Hậu Biên', 'Phía sau; đằng sau; phần cuối; đằng sau; gần cuối; ở phía sau', 1, 'HSK 3.0', '学校后边有一条小河。', 'Phía sau trường có một con sông nhỏ.', NOW(), NOW()),
('后天', 'hòutiān', 'houtian', 'Hậu Thiên', 'Ngày mốt; cuộc sống sau khi sinh', 1, 'HSK 3.0', '后天是星期天。', 'Ngày kia là chủ nhật.', NOW(), NOW()),
('花', 'huā', 'hua', 'Hoa', 'Hoa; tiêu (tiền, thời gian)', 1, 'HSK 3.0', '花园里开满了花。', 'Trong vườn hoa nở rực rỡ.', NOW(), NOW()),
('话', 'huà', 'hua', 'Thoại', 'Phương ngữ; ngôn ngữ', 1, 'HSK 3.0', '他的话很有道理。', 'Lời nói của anh ấy rất có lý.', NOW(), NOW()),
('坏', 'huài', 'huai', 'Hoại', 'Xấu; bị hỏng', 1, 'HSK 3.0', '我的手表坏了。', 'Đồng hồ đeo tay của tôi bị hỏng rồi.', NOW(), NOW()),
('还', 'huán', 'huan', 'Hoàn', 'Vẫn; còn; trả lại', 1, 'HSK 3.0', '我吃饱了，还想喝点水。', 'Tôi ăn no rồi, vẫn muốn uống chút nước.', NOW(), NOW()),
('回', 'huí', 'hui', 'Hồi', 'Xoay vòng; quay lại', 1, 'HSK 3.0', '下课后我回家。', 'Sau khi tan học tôi về nhà.', NOW(), NOW()),
('回答', 'huídá', 'huida', 'Hồi Đáp', 'Trả lời; đáp; trả lời; đáp án', 1, 'HSK 3.0', '请回答老师的问题。', 'Xin hãy trả lời câu hỏi của thầy giáo.', NOW(), NOW()),
('回到', 'huídào', 'huidao', 'Hồi Đáo', 'Trở về', 1, 'HSK 3.0', '我们晚上回到了家。', 'Chúng tôi đã trở về nhà vào buổi tối.', NOW(), NOW()),
('回家', 'huí jiā', 'hui jia', 'Hồi Gia', 'Trở về nhà', 1, 'HSK 3.0', '我要回家吃晚饭。', 'Tôi phải về nhà ăn tối.', NOW(), NOW()),
('回来', 'huílái', 'huilai', 'Hồi Lai', 'Trở về; quay lại', 1, 'HSK 3.0', '爸爸什么时候回来？', 'Khi nào thì bố trở về?', NOW(), NOW()),
('回去', 'huíqù', 'huiqu', 'Hồi Khứ', 'Trở về; quay lại', 1, 'HSK 3.0', '天黑了，我们回去吧。', 'Trời tối rồi, chúng ta về thôi nào.', NOW(), NOW()),
('会', 'huì', 'hui', 'Hội', 'Biết; sẽ; hội họp', 1, 'HSK 3.0', '我会说汉语。', 'Tôi biết nói tiếng Trung.', NOW(), NOW()),
('火车', 'huǒchē', 'huoche', 'Hoả Xa', 'Tàu hỏa', 1, 'HSK 3.0', '坐火车去旅行很舒服。', 'Đi tàu hỏa du lịch rất thoải mái.', NOW(), NOW()),
('机场', 'jīchǎng', 'jichang', 'Cơ Tràng', 'Sân bay; phi trường; nhà cung cấp dịch vụ cho Shadowsocks hoặc phần mềm tương tự để vượt kiểm duyệt Internet', 1, 'HSK 3.0', '我们去机场接朋友。', 'Chúng tôi đến sân bay đón bạn.', NOW(), NOW()),
('机票', 'jīpiào', 'jipiao', 'Cơ Phiếu', 'Vé máy bay; vé hành khách', 1, 'HSK 3.0', '我已经买好了飞机票。', 'Tôi đã mua xong vé máy bay rồi.', NOW(), NOW()),
('鸡蛋', 'jīdàn', 'jidan', 'Kê Đản', 'Trứng; trứng gà', 1, 'HSK 3.0', '早上我吃了一个鸡蛋。', 'Buổi sáng tôi đã ăn một quả trứng gà.', NOW(), NOW()),
('几', 'jǐ', 'ji', 'Cơ', 'Mấy; vài', 1, 'HSK 3.0', '你家里有几口人？', 'Nhà bạn có mấy người?', NOW(), NOW()),
('记', 'jì', 'ji', 'Ký', 'Ghi chép; ghi lại', 1, 'HSK 3.0', '请把这个生词记下来。', 'Xin hãy ghi nhớ từ mới này.', NOW(), NOW()),
('记得', 'jìde', 'jide', 'Ký Đắc', 'Nhớ', 1, 'HSK 3.0', '我记得他的名字。', 'Tôi vẫn nhớ tên của anh ấy.', NOW(), NOW()),
('记住', 'jìzhù', 'jizhu', 'Ký Trú', 'Nhớ; ghi nhớ', 1, 'HSK 3.0', '请大家一定要记住这些生词。', 'Xin mọi người nhất định phải ghi nhớ các từ mới này.', NOW(), NOW()),
('家', 'jiā', 'jia', 'Gia', 'Dùng trong 傢伙|家伙 và 傢俱|家俱', 1, 'HSK 3.0', '我家在河内。', 'Nhà tôi ở Hà Nội.', NOW(), NOW()),
('家里', 'jiā li', 'jia li', 'Gia Lý', 'Nhà', 1, 'HSK 3.0', '家里只有我和妈妈。', 'Trong nhà chỉ có tôi và mẹ.', NOW(), NOW()),
('家人', 'jiārén', 'jiaren', 'Gia Nhân', 'Thành viên gia đình; người hầu', 1, 'HSK 3.0', '我和家人一起生活。', 'Tôi sống cùng với người nhà.', NOW(), NOW()),
('间', 'jiān', 'jian', 'Gian', 'Giữa; trong số', 1, 'HSK 3.0', '这是一间新教室。', 'Đây là một gian phòng học mới.', NOW(), NOW()),
('见', 'jiàn', 'jian', 'Kiến', 'Gặp; thấy', 1, 'HSK 3.0', '明天见！', 'Hẹn gặp lại ngày mai!', NOW(), NOW()),
('见面', 'jiànmiàn', 'jianmian', 'Kiến Diện', 'Gặp mặt; gặp nhau', 1, 'HSK 3.0', '很高兴跟你见面。', 'Rất vui được gặp mặt bạn.', NOW(), NOW()),
('教', 'jiāo', 'jiao', 'Giáo', 'Dạy; giảng dạy', 1, 'HSK 3.0', '王老师教我们汉语。', 'Thầy Vương dạy chúng tôi tiếng Trung.', NOW(), NOW()),
('叫', 'jiào', 'jiao', 'Khiếu', 'Kêu; gọi; tên là', 1, 'HSK 3.0', '我叫王明。', 'Tôi tên là Vương Minh.', NOW(), NOW()),
('教学楼', 'jiàoxuélóu', 'jiaoxuelou', 'Giáo Học Lâu', 'Tòa nhà trường học; tòa nhà học thuật', 1, 'HSK 3.0', '这是我们学校的教学楼。', 'Đây là tòa nhà giảng dạy của trường chúng tôi.', NOW(), NOW()),
('姐姐', 'jiějie', 'jiejie', 'Tỷ Tỷ', 'Chị gái', 1, 'HSK 3.0', '我姐姐在医院当护士。', 'Chị gái tôi làm y tá ở bệnh viện.', NOW(), NOW()),
('介绍', 'jièshào', 'jieshao', 'Giới Thiệu', 'Giới thiệu; thuyết trình', 1, 'HSK 3.0', '让我介绍一下我的朋友。', 'Để tôi giới thiệu một chút về bạn tôi nhé.', NOW(), NOW()),
('今年', 'jīnnián', 'jinnian', 'Kim Niên', 'Năm nay', 1, 'HSK 3.0', '我今年十八岁。', 'Tôi năm nay mười tám tuổi.', NOW(), NOW()),
('今天', 'jīntiān', 'jintian', 'Kim Thiên', 'Hôm nay; thời điểm hiện tại; bây giờ', 1, 'HSK 3.0', '今天星期一。', 'Hôm nay là thứ hai.', NOW(), NOW()),
('进', 'jìn', 'jin', 'Tiến', 'Vào; tiến vào', 1, 'HSK 3.0', '请进，请坐。', 'Mời vào, mời ngồi.', NOW(), NOW()),
('进来', 'jìnlái', 'jinlai', 'Tiến Lai', 'Đến; vào', 1, 'HSK 3.0', '请快点进来吧。', 'Xin hãy mau chóng vào đây nào.', NOW(), NOW()),
('进去', 'jìnqù', 'jinqu', 'Tiến Khứ', 'Đi vào', 1, 'HSK 3.0', '我们可以进去参观吗？', 'Chúng ta có thể đi vào trong tham quan không?', NOW(), NOW()),
('九', 'jiǔ', 'jiu', 'Cửu', 'Chín; 9', 1, 'HSK 3.0', '教室里有九张桌子。', 'Trong lớp học có chín chiếc bàn.', NOW(), NOW()),
('就', 'jiù', 'jiu', 'Tựu', 'Thì; liền; ngay', 1, 'HSK 3.0', '我就是你要找的人。', 'Tôi chính là người mà bạn đang tìm kiếm.', NOW(), NOW()),
('觉得', 'juéde', 'juede', 'Giáo Đắc', 'Nghĩ rằng ...; cảm thấy rằng ...; cảm thấy', 1, 'HSK 3.0', '我觉得汉语很有趣。', 'Tôi cảm thấy tiếng Trung rất thú vị.', NOW(), NOW()),
('开', 'kāi', 'kai', 'Khai', 'Mở; lái (xe); bật', 1, 'HSK 3.0', '请开一下窗户。', 'Xin mở cửa sổ ra một chút.', NOW(), NOW()),
('开车', 'kāichē', 'kaiche', 'Khai Xa', 'Lái xe', 1, 'HSK 3.0', '爸爸开车送我去学校。', 'Bố lái xe đưa tôi đến trường.', NOW(), NOW()),
('开会', 'kāihuì', 'kaihui', 'Khai Hội', 'Tổ chức cuộc họp; tham gia cuộc họp', 1, 'HSK 3.0', '经理正在开会。', 'Giám đốc đang họp.', NOW(), NOW()),
('开玩笑', 'kāi wánxiào', 'kai wanxiao', 'Khai Ngoạn Tiếu', 'Đùa giỡn; chế nhạo; nói đùa', 1, 'HSK 3.0', '别生气，他只是开玩笑。', 'Đừng giận, anh ấy chỉ đùa thôi.', NOW(), NOW()),
('看', 'kàn', 'kan', 'Khán', 'Nhìn; xem; thăm', 1, 'HSK 3.0', '你在看什么书？', 'Bạn đang xem cuốn sách gì thế?', NOW(), NOW()),
('看病', 'kànbìng', 'kanbing', 'Khán Bệnh', 'Đi khám bệnh; khám bệnh nhân', 1, 'HSK 3.0', '他觉得不舒服，去医院看病。', 'Anh ấy cảm thấy không khỏe, đi bệnh viện khám bệnh.', NOW(), NOW()),
('看到', 'kàndào', 'kandao', 'Khán Đáo', 'Nhìn thấy', 1, 'HSK 3.0', '我看到他在操场上跑步。', 'Tôi nhìn thấy anh ấy đang chạy bộ trên sân tập.', NOW(), NOW()),
('看见', 'kànjiàn', 'kanjian', 'Khán Kiến', 'Nhìn thấy; bắt gặp', 1, 'HSK 3.0', '我看见了一只可爱的小猫。', 'Tôi nhìn thấy một chú mèo con đáng yêu.', NOW(), NOW()),
('考', 'kǎo', 'kao', 'Khảo', 'Đánh; đập', 1, 'HSK 3.0', '明天我们要考汉语。', 'Ngày mai chúng tôi phải thi tiếng Trung.', NOW(), NOW()),
('考试', 'kǎoshì', 'kaoshi', 'Khảo Thí', 'Dự thi; kỳ thi', 1, 'HSK 3.0', '祝你在考试中取得好成绩。', 'Chúc bạn đạt thành tích tốt trong kỳ thi.', NOW(), NOW()),
('渴', 'kě', 'ke', 'Khát', 'Khát', 1, 'HSK 3.0', '我渴了，想喝水。', 'Tôi khát rồi, muốn uống nước.', NOW(), NOW()),
('课', 'kè', 'ke', 'Khoá', 'Môn học; khoá học', 1, 'HSK 3.0', '今天下午我们有两节课。', 'Chiều nay chúng tôi có hai tiết học.', NOW(), NOW()),
('课本', 'kèběn', 'keben', 'Khoá Bản', 'Sách giáo khoa', 1, 'HSK 3.0', '请大家翻开课本第二十页。', 'Xin mọi người mở sách giáo khoa trang 20.', NOW(), NOW()),
('课文', 'kèwén', 'kewen', 'Khoá Văn', 'Bài đọc', 1, 'HSK 3.0', '请跟我一起读课文。', 'Xin hãy cùng tôi đọc bài khóa.', NOW(), NOW()),
('口', 'kǒu', 'kou', 'Khẩu', 'Miệng; lượng từ cho những thứ có miệng', 1, 'HSK 3.0', '我家有四口人。', 'Nhà tôi có bốn người.', NOW(), NOW()),
('块', 'kuài', 'kuai', 'Khối', 'Cục; tảng; miếng; lượng từ cho miếng vải, bánh, xà phòng, v.v.', 1, 'HSK 3.0', '这块手表很漂亮。', 'Chiếc đồng hồ này rất đẹp.', NOW(), NOW()),
('快', 'kuài', 'kuai', 'Khoái', 'Nhanh; sắp sửa', 1, 'HSK 3.0', '时间过得真快。', 'Thời gian trôi qua thật nhanh.', NOW(), NOW()),
('来', 'lái', 'lai', 'Lai', 'Đến; tới', 1, 'HSK 3.0', '欢迎你来到我们学校。', 'Hoan nghênh bạn đến trường của chúng tôi.', NOW(), NOW()),
('来到', 'láidào', 'laidao', 'Lai Đáo', 'Đến; tới', 1, 'HSK 3.0', '春天来到了大地。', 'Mùa xuân đã đến với đất trời.', NOW(), NOW()),
('老', 'lǎo', 'lao', 'Lão', 'Già; cũ; lâu năm', 1, 'HSK 3.0', '王老师是一位老教师。', 'Thầy Vương là một giáo viên lâu năm.', NOW(), NOW()),
('老人', 'lǎorén', 'laoren', 'Lão Nhân', 'Ông già hoặc bà già; người cao tuổi', 1, 'HSK 3.0', '我们要关爱老人。', 'Chúng ta cần quan tâm chăm sóc người già.', NOW(), NOW()),
('老师', 'lǎoshī', 'laoshi', 'Lão Sư', 'Giáo viên', 1, 'HSK 3.0', '张老师教我们中国历史。', 'Cô Trương dạy chúng tôi lịch sử Trung Quốc.', NOW(), NOW()),
('了', 'le', 'le', 'Liễu', 'Rồi; đã (trợ từ ngữ khí/thời thái)', 1, 'HSK 3.0', '下雨了，带上伞吧。', 'Trời mưa rồi, mang theo ô đi nhé.', NOW(), NOW()),
('累', 'lèi', 'lei', 'Luỵ', 'Tích lũy; liên lụy hoặc dính líu', 1, 'HSK 3.0', '今天工作很忙，我有点累。', 'Hôm nay công việc rất bận, tôi hơi mệt.', NOW(), NOW()),
('冷', 'lěng', 'leng', 'Lạnh', 'Lạnh', 1, 'HSK 3.0', '冬天的北京很冷。', 'Mùa đông ở Bắc Kinh rất lạnh.', NOW(), NOW()),
('里', 'lǐ', 'li', 'Lý', 'Trong; bên trong', 1, 'HSK 3.0', '书包里有课本和笔。', 'Trong cặp sách có sách giáo khoa và bút.', NOW(), NOW()),
('里边', 'lǐbian', 'libian', 'Lý Biên', 'Bên trong', 1, 'HSK 3.0', '屋子里边很暖和。', 'Bên trong căn phòng rất ấm áp.', NOW(), NOW()),
('两', 'liǎng', 'liang', 'Lưỡng', 'Hai; cả hai', 1, 'HSK 3.0', '我有两个好朋友。', 'Tôi có hai người bạn tốt.', NOW(), NOW()),
('零', 'líng', 'ling', 'Linh', 'Không; số không', 1, 'HSK 3.0', '今天的气温是零度。', 'Nhiệt độ hôm nay là không độ.', NOW(), NOW()),
('六', 'liù', 'liu', 'Lục', 'Sáu; 6', 1, 'HSK 3.0', '一星期有六天需要上学。', 'Một tuần có sáu ngày cần đi học.', NOW(), NOW()),
('楼', 'lóu', 'lou', 'Lâu', 'Họ', 1, 'HSK 3.0', '我住在五楼。', 'Tôi sống ở tầng năm.', NOW(), NOW()),
('楼上', 'lóu shàng', 'lou shang', 'Lâu Thướng', 'Tầng trên; người đăng trước trong một chủ đề diễn đàn', 1, 'HSK 3.0', '他在楼上看书。', 'Anh ấy đang đọc sách ở trên lầu.', NOW(), NOW()),
('楼下', 'lóu xià', 'lou xia', 'Lâu Hạ', 'Tầng dưới', 1, 'HSK 3.0', '我们在楼下等你。', 'Chúng tôi đợi bạn ở dưới lầu.', NOW(), NOW()),
('路', 'lù', 'lu', 'Lộ', 'Họ', 1, 'HSK 3.0', '这条路非常宽。', 'Con đường này rất rộng rãi.', NOW(), NOW()),
('路口', 'lùkǒu', 'lukou', 'Lộ Khẩu', 'Giao lộ; ngã tư', 1, 'HSK 3.0', '我们在十字路口见。', 'Chúng ta gặp nhau ở ngã tư đường nhé.', NOW(), NOW()),
('路上', 'lùshang', 'lushang', 'Lộ Thướng', 'Trên đường; trên đường; đang đi', 1, 'HSK 3.0', '路上车很多，注意安全。', 'Trên đường xe cộ rất đông, hãy chú ý an toàn.', NOW(), NOW()),
('妈妈', 'māma', 'mama', 'Má Má', 'Mẹ; má', 1, 'HSK 3.0', '妈妈每天都为我们做饭。', 'Mẹ ngày nào cũng nấu cơm cho chúng tôi.', NOW(), NOW()),
('马路', 'mǎlù', 'malu', 'Mã Lộ', 'Đường phố; đường', 1, 'HSK 3.0', '过马路要走斑马线。', 'Sang đường phải đi trên vạch kẻ đường cho người đi bộ.', NOW(), NOW()),
('马上', 'mǎshàng', 'mashang', 'Mã Thướng', 'Ngay lập tức; ngay tức khắc', 1, 'HSK 3.0', '请稍等，我马上就来。', 'Xin đợi một chút, tôi tới ngay đây.', NOW(), NOW()),
('吗', 'ma', 'ma', 'Ma', 'Phải không; không (trợ từ nghi vấn)', 1, 'HSK 3.0', '你是中国人吗？', 'Bạn là người Trung Quốc phải không?', NOW(), NOW()),
('买', 'mǎi', 'mai', 'Mãi', 'Mua', 1, 'HSK 3.0', '我想去超市买点水果。', 'Tôi muốn đi siêu thị mua chút hoa quả.', NOW(), NOW()),
('慢', 'màn', 'man', 'Mạn', 'Chậm', 1, 'HSK 3.0', '他走得很慢。', 'Anh ấy bước đi rất chậm chạp.', NOW(), NOW()),
('忙', 'máng', 'mang', 'Mang', 'Bận rộn; bận', 1, 'HSK 3.0', '最近你工作忙吗？', 'Dạo này công việc của bạn có bận không?', NOW(), NOW()),
('毛', 'máo', 'mao', 'Mao', 'Họ', 1, 'HSK 3.0', '这个苹果五毛钱。', 'Quả táo này giá năm hào.', NOW(), NOW()),
('没', 'méi', 'mei', 'Một', 'Không; chưa có', 1, 'HSK 3.0', '我没去过北京。', 'Tôi chưa từng đến Bắc Kinh.', NOW(), NOW()),
('没关系', 'méi guānxi', 'mei guanxi', 'Một Quan Hệ', 'Không sao đâu', 1, 'HSK 3.0', '没关系，别放在心上。', 'Không sao, đừng để trong lòng.', NOW(), NOW()),
('没什么', 'méi shénme', 'mei shenme', 'Một Thậm Yêu', 'Không sao; không có gì; đừng bận tâm; nghĩ không có gì; rất hân hạnh; không có chi; không có gì', 1, 'HSK 3.0', '没什么大不了的事。', 'Chẳng có việc gì to tát cả.', NOW(), NOW()),
('没事儿', 'méishìr', 'meishir', 'Một Sự Nhân', 'Có thời gian rảnh; rảnh rỗi', 1, 'HSK 3.0', '别担心，我没事儿。', 'Đừng lo lắng, tôi không sao đâu.', NOW(), NOW()),
('没有', 'méiyǒu', 'meiyou', 'Một Hữu', 'Không có; không tồn tại', 1, 'HSK 3.0', '书架上没有这本书。', 'Trên giá sách không có quyển sách này.', NOW(), NOW()),
('妹妹', 'mèimei', 'meimei', 'Muội Muội', 'Em gái; phụ nữ trẻ', 1, 'HSK 3.0', '我妹妹最喜欢画画。', 'Em gái tôi thích vẽ tranh nhất.', NOW(), NOW()),
('门', 'mén', 'men', 'Môn', 'Cửa; cổng', 1, 'HSK 3.0', '请帮我把门关上。', 'Xin giúp tôi đóng cửa lại.', NOW(), NOW()),
('门口', 'ménkǒu', 'menkou', 'Môn Khẩu', 'Cửa ra vào; cổng', 1, 'HSK 3.0', '我们在学校门口等老师。', 'Chúng tôi đợi thầy giáo ở cổng trường.', NOW(), NOW()),
('门票', 'ménpiào', 'menpiao', 'Môn Phiếu', 'Vé', 1, 'HSK 3.0', '故宫的门票多少钱一张？', 'Vé vào Cố Cung bao nhiêu tiền một vé?', NOW(), NOW()),
('们', 'men (péngyoumen)', 'men (pengyoumen)', 'Môn', 'Dùng để chỉ số nhiều cho đại từ và danh từ chỉ người', 1, 'HSK 3.0', '同学们好，请坐下。', 'Chào các em học sinh, xin mời ngồi xuống.', NOW(), NOW()),
('米饭', 'mǐfàn', 'mifan', 'Mễ Phạn', 'Đã nấu', 1, 'HSK 3.0', '中国人常常吃米饭。', 'Người Trung Quốc thường xuyên ăn cơm.', NOW(), NOW()),
('面包', 'miànbāo', 'mianbao', 'Diện Bao', 'Bánh mì', 1, 'HSK 3.0', '早餐我吃面包喝牛奶。', 'Bữa sáng tôi ăn bánh mì và uống sữa bò.', NOW(), NOW()),
('面条儿', 'miàntiáor', 'miantiaor', 'Diện Điều Nhân', 'Biến thể er hoá của 麵條|面条', 1, 'HSK 3.0', '中午我想吃一碗热面条儿。', 'Buổi trưa tôi muốn ăn một bát mì sợi nóng hổi.', NOW(), NOW()),
('名字', 'míngzi', 'mingzi', 'Danh Tự', 'Tên', 1, 'HSK 3.0', '你叫什么名字？', 'Bạn tên là gì?', NOW(), NOW()),
('明白', 'míngbai', 'mingbai', 'Minh Bạch', 'Rõ ràng; hiển nhiên', 1, 'HSK 3.0', '老师讲的话我都明白了。', 'Những lời thầy giảng tôi đều hiểu rõ rồi.', NOW(), NOW()),
('明年', 'míngnián', 'mingnian', 'Minh Niên', 'Năm sau', 1, 'HSK 3.0', '明年我打算去上海旅游。', 'Năm tới tôi dự định đi Thượng Hải du lịch.', NOW(), NOW()),
('明天', 'míngtiān', 'mingtian', 'Minh Thiên', 'Ngày mai', 1, 'HSK 3.0', '明天是星期六，不用上课。', 'Ngày mai là thứ bảy, không phải đi học.', NOW(), NOW()),
('拿', 'ná', 'na', 'Nã', 'Cầm; lấy', 1, 'HSK 3.0', '请帮我拿一下包。', 'Xin hãy giúp tôi cầm chiếc túi một lát.', NOW(), NOW()),
('哪', 'nǎ', 'na', 'Nả', 'Như thế nào; cái nào', 1, 'HSK 3.0', '你想去哪儿旅游？', 'Bạn muốn đi đâu du lịch?', NOW(), NOW()),
('哪里', 'nǎlǐ', 'nali', 'Nả Lý', 'Ở đâu?; một nơi nào đó', 1, 'HSK 3.0', '请问洗手间在哪里？', 'Xin hỏi nhà vệ sinh ở đâu vậy?', NOW(), NOW()),
('哪儿', 'nǎr', 'nar', 'Nả Nhân', 'Ở đâu?; bất cứ đâu; nơi nào đó', 1, 'HSK 3.0', '你要去哪儿？', 'Bạn định đi đâu?', NOW(), NOW()),
('哪些', 'nǎxiē', 'naxie', 'Nả Ta', 'Những cái nào?; ai?', 1, 'HSK 3.0', '这些书中哪些是你喜欢的？', 'Trong số những cuốn sách này những cuốn nào bạn thích?', NOW(), NOW()),
('那', 'nà', 'na', 'Na', 'Họ', 1, 'HSK 3.0', '那是谁的书？', 'Kia là sách của ai?', NOW(), NOW()),
('那边', 'nàbiān', 'nabian', 'Na Biên', 'Đằng kia; ở đằng đó', 1, 'HSK 3.0', '书店在那边。', 'Hiệu sách ở phía bên kia.', NOW(), NOW()),
('那里', 'nàlǐ', 'nali', 'Na Lý', 'Ở đó; nơi đó', 1, 'HSK 3.0', '我常常去那里喝茶。', 'Tôi thường đến chỗ đó uống trà.', NOW(), NOW()),
('那儿', 'nàr', 'nar', 'Na Nhân', 'Ở đó', 1, 'HSK 3.0', '他在那儿等你。', 'Anh ấy đang ở đằng kia đợi bạn.', NOW(), NOW()),
('那些', 'nàxiē', 'naxie', 'Na Ta', 'Những cái đó', 1, 'HSK 3.0', '那些花开得很漂亮。', 'Những bông hoa kia nở rất đẹp.', NOW(), NOW()),
('奶', 'nǎi', 'nai', 'Nãi', 'Vú; sữa', 1, 'HSK 3.0', '小猫喜欢喝牛奶。', 'Mèo con thích uống sữa bò.', NOW(), NOW()),
('奶奶', 'nǎinai', 'nainai', 'Nãi Nãi', 'Bà; bà chủ nhà', 1, 'HSK 3.0', '我奶奶今年七十五岁。', 'Bà nội tôi năm nay bảy mươi lăm tuổi.', NOW(), NOW()),
('男', 'nán', 'nan', 'Nam', 'Nam; Nam tước, cấp thấp nhất trong năm cấp bậc quý tộc 五等爵位', 1, 'HSK 3.0', '他是我们的男班长。', 'Anh ấy là lớp trưởng nam của chúng tôi.', NOW(), NOW()),
('男孩儿', 'nánháir', 'nanhair', 'Nam Hài Nhân', 'Biến thể er hoá của 男孩', 1, 'HSK 3.0', '那个男孩儿非常聪明。', 'Cậu bé trai đó rất thông minh.', NOW(), NOW()),
('男朋友', 'nánpéngyou', 'nanpengyou', 'Nam Bằng Hữu', 'Bạn trai', 1, 'HSK 3.0', '他是我的男朋友。', 'Anh ấy là bạn trai của tôi.', NOW(), NOW()),
('男人', 'nánrén', 'nanren', 'Nam Nhân', 'Một người đàn ông; một nam giới', 1, 'HSK 3.0', '那位男人是一位医生。', 'Người đàn ông đó là một bác sĩ.', NOW(), NOW()),
('男生', 'nánshēng', 'nansheng', 'Nam Sinh', 'Nam sinh; học sinh nam', 1, 'HSK 3.0', '我们班有十五个男生。', 'Lớp chúng tôi có mười lăm học sinh nam.', NOW(), NOW()),
('南', 'nán', 'nan', 'Nam', 'Họ', 1, 'HSK 3.0', '学校的南边是一个大公园。', 'Phía nam trường học là một công viên lớn.', NOW(), NOW()),
('南边', 'nánbian', 'nanbian', 'Nam Biên', 'Phía nam; mặt nam', 1, 'HSK 3.0', '他在南边工作。', 'Anh ấy làm việc ở phía nam.', NOW(), NOW()),
('难', 'nán', 'nan', 'Nan', 'Khó; nan giải', 1, 'HSK 3.0', '汉语的发音有点难。', 'Phát âm tiếng Trung hơi khó một chút.', NOW(), NOW()),
('呢', 'ne', 'ne', 'Ni', 'Thế; nhỉ; còn... thì sao (trợ từ ngữ khí)', 1, 'HSK 3.0', '我是越南人，你呢？', 'Tôi là người Việt Nam, còn bạn thì sao?', NOW(), NOW()),
('能', 'néng', 'neng', 'Năng', 'Họ', 1, 'HSK 3.0', '你能帮我翻译这个句子吗？', 'Bạn có thể giúp tôi dịch câu này không?', NOW(), NOW()),
('你', 'nǐ', 'ni', 'Nễ', 'Bạn', 1, 'HSK 3.0', '很高兴认识你。', 'Rất vui được làm quen với bạn.', NOW(), NOW()),
('你们', 'nǐmen', 'nimen', 'Nễ Môn', 'Các bạn', 1, 'HSK 3.0', '你们都是大学生吗？', 'Các bạn đều là sinh viên đại học phải không?', NOW(), NOW()),
('年', 'nián', 'nian', 'Niên', 'Họ', 1, 'HSK 3.0', '一年有十二个月。', 'Một năm có mười hai tháng.', NOW(), NOW()),
('您', 'nín', 'nin', 'Nâm', 'Bạn', 1, 'HSK 3.0', '老师，您好！', 'Em chào thầy ạ!', NOW(), NOW()),
('牛奶', 'niúnǎi', 'niunai', 'Ngưu Nãi', 'Sữa bò', 1, 'HSK 3.0', '喝牛奶对身体很好。', 'Uống sữa bò rất tốt cho sức khỏe.', NOW(), NOW()),
('女', 'nǚ', 'nu', 'Nữ', 'Nữ; phụ nữ', 1, 'HSK 3.0', '她是我们的女老师。', 'Cô ấy là cô giáo của chúng tôi.', NOW(), NOW()),
('女儿', 'nǚ''ér', 'nu''er', 'Nữ Nhân', 'Con gái', 1, 'HSK 3.0', '他的女儿正在上小学。', 'Con gái anh ấy đang học tiểu học.', NOW(), NOW()),
('女孩儿', 'nǚháir', 'nuhair', 'Nữ Hài Nhân', 'Biến thể er hoá của 女孩', 1, 'HSK 3.0', '那个小女孩儿真漂亮。', 'Bé gái kia thật xinh xắn.', NOW(), NOW()),
('女朋友', 'nǚpéngyou', 'nupengyou', 'Nữ Bằng Hữu', 'Bạn gái', 1, 'HSK 3.0', '她是我的女朋友。', 'Cô ấy là bạn gái của tôi.', NOW(), NOW()),
('女人', 'nǚrén', 'nuren', 'Nữ Nhân', 'Phụ nữ', 1, 'HSK 3.0', '那位女人很有才华。', 'Người phụ nữ đó rất tài năng.', NOW(), NOW()),
('女生', 'nǚshēng', 'nusheng', 'Nữ Sinh', 'Nữ sinh; học sinh nữ', 1, 'HSK 3.0', '我们班女生比男生多。', 'Lớp chúng tôi bạn nữ nhiều hơn bạn nam.', NOW(), NOW()),
('旁边', 'pángbiān', 'pangbian', 'Bàng Biên', 'Bên; nơi liền kề', 1, 'HSK 3.0', '我家旁边有一家便利店。', 'Bên cạnh nhà tôi có một cửa hàng tiện lợi.', NOW(), NOW()),
('跑', 'pǎo', 'pao', 'Bào', 'Chạy', 1, 'HSK 3.0', '小狗在草地上飞快地跑。', 'Chú cún con chạy rất nhanh trên bãi cỏ.', NOW(), NOW()),
('朋友', 'péngyou', 'pengyou', 'Bằng Hữu', 'Bạn', 1, 'HSK 3.0', '好朋友会互相帮助。', 'Bạn bè tốt sẽ luôn giúp đỡ lẫn nhau.', NOW(), NOW()),
('票', 'piào', 'piao', 'Phiếu', 'Vé; phiếu', 1, 'HSK 3.0', '我们买了两张电影票。', 'Chúng tôi đã mua hai tấm vé xem phim.', NOW(), NOW()),
('七', 'qī', 'qi', 'Thất', 'Bảy; 7', 1, 'HSK 3.0', '一个星期有七天。', 'Một tuần có bảy ngày.', NOW(), NOW()),
('起', 'qǐ', 'qi', 'Khởi', 'Dậy; khởi đầu; bắt đầu', 1, 'HSK 3.0', '早上六点我就起来了。', 'Sáu giờ sáng tôi đã thức dậy rồi.', NOW(), NOW()),
('起床', 'qǐchuáng', 'qichuang', 'Khởi Sàng', 'Thức dậy; ngủ dậy', 1, 'HSK 3.0', '明天早上七点我要起床。', 'Sáng mai bảy giờ tôi phải thức dậy.', NOW(), NOW()),
('起来', 'qǐlái', 'qilai', 'Khởi Lai', 'Đứng lên; thức dậy; cũng đọc là', 1, 'HSK 3.0', '快起来，太阳晒屁股了。', 'Mau dậy đi, mặt trời lên cao rồi.', NOW(), NOW()),
('汽车', 'qìchē', 'qiche', 'Khí Xa', 'Xe hơi; xe ô tô', 1, 'HSK 3.0', '路上来来往往很多汽车。', 'Trên đường xe hơi đi lại tấp nập.', NOW(), NOW()),
('前', 'qián', 'qian', 'Tiền', 'Trước; phía trước', 1, 'HSK 3.0', '吃饭前要洗手。', 'Trước khi ăn cơm phải rửa tay.', NOW(), NOW()),
('前边', 'qiánbian', 'qianbian', 'Tiền Biên', 'Phía trước; mặt trước', 1, 'HSK 3.0', '他在我们前边走。', 'Anh ấy đi ở phía trước chúng tôi.', NOW(), NOW()),
('前天', 'qiántiān', 'qiantian', 'Tiền Thiên', 'Ngày hôm kia', 1, 'HSK 3.0', '前天我们参加了考试。', 'Hôm kia chúng tôi đã tham gia kỳ thi.', NOW(), NOW()),
('钱', 'qián', 'qian', 'Tiền', 'Họ', 1, 'HSK 3.0', '买这件衣服花了不少钱。', 'Mua chiếc áo này tốn không ít tiền.', NOW(), NOW()),
('钱包', 'qiánbāo', 'qianbao', 'Tiền Bao', 'Ví; bóp tiền', 1, 'HSK 3.0', '我的钱包掉在车上了。', 'Ví tiền của tôi bị rơi trên xe rồi.', NOW(), NOW()),
('请', 'qǐng', 'qing', 'Thỉnh', 'Mời; mời mọc', 1, 'HSK 3.0', '请进，请坐，请喝茶。', 'Mời vào, mời ngồi, mời uống trà.', NOW(), NOW()),
('请假', 'qǐngjià', 'qingjia', 'Thỉnh Giả', 'Xin nghỉ phép', 1, 'HSK 3.0', '他今天生病，向老师请假。', 'Hôm nay anh ấy bị ốm nên xin phép thầy nghỉ học.', NOW(), NOW()),
('请进', 'qǐng jìn', 'qing jin', 'Thỉnh Tiến', '"mời vào"', 1, 'HSK 3.0', '外面冷，请进屋坐。', 'Bên ngoài lạnh, xin mời vào nhà ngồi.', NOW(), NOW()),
('请问', 'qǐngwèn', 'qingwen', 'Thỉnh Vấn', 'Xin lỗi, cho tôi hỏi...?', 1, 'HSK 3.0', '请问去图书馆怎么走？', 'Xin hỏi đi đến thư viện đi đường nào?', NOW(), NOW()),
('请坐', 'qǐng zuò', 'qing zuo', 'Thỉnh Toạ', 'Xin mời ngồi', 1, 'HSK 3.0', '客人来了，请坐。', 'Khách đến rồi, xin mời ngồi.', NOW(), NOW()),
('球', 'qiú', 'qiu', 'Cầu', 'Quả bóng; hình cầu', 1, 'HSK 3.0', '孩子们在操场上踢球。', 'Lũ trẻ đang đá bóng trên sân tập.', NOW(), NOW()),
('去', 'qù', 'qu', 'Khứ', 'Đi; đi đến', 1, 'HSK 3.0', '明天我想去书店买书。', 'Ngày mai tôi muốn đến hiệu sách mua sách.', NOW(), NOW()),
('去年', 'qùnián', 'qunian', 'Khứ Niên', 'Năm ngoái', 1, 'HSK 3.0', '去年我在北京学汉语。', 'Năm ngoái tôi học tiếng Trung ở Bắc Kinh.', NOW(), NOW()),
('热', 'rè', 're', 'Nhiệt', 'Nóng; nhiệt tình', 1, 'HSK 3.0', '夏天天气很热。', 'Mùa hè thời tiết rất nóng nực.', NOW(), NOW()),
('人', 'rén', 'ren', 'Nhân', 'Người; mọi người', 1, 'HSK 3.0', '这里的人非常热情。', 'Người dân ở đây rất nhiệt tình.', NOW(), NOW()),
('认识', 'rènshi', 'renshi', 'Nhận Thức', 'Biết; nhận ra', 1, 'HSK 3.0', '认识你很高兴。', 'Rất vui được làm quen với bạn.', NOW(), NOW()),
('认真', 'rènzhēn', 'renzhen', 'Nhận Chân', 'Tận tâm; nghiêm túc', 1, 'HSK 3.0', '大家都在认真地学习汉语。', 'Mọi người đều đang chăm chỉ học tiếng Trung.', NOW(), NOW()),
('日', 'rì', 'ri', 'Nhật', 'Ngày; mặt trời', 1, 'HSK 3.0', '十月一日是国庆节。', 'Ngày một tháng mười là ngày Quốc khánh.', NOW(), NOW()),
('日期', 'rìqī', 'riqi', 'Nhật Kỳ', 'Ngày tháng', 1, 'HSK 3.0', '请在表格上写下今天的日期。', 'Xin hãy ghi ngày tháng hôm nay vào biểu mẫu.', NOW(), NOW()),
('肉', 'ròu', 'rou', 'Nhục', 'Thịt; thịt quả', 1, 'HSK 3.0', '我不喜欢吃肥肉。', 'Tôi không thích ăn thịt mỡ.', NOW(), NOW()),
('三', 'sān', 'san', 'Tam', 'Họ', 1, 'HSK 3.0', '我们班有三个外国留学生。', 'Lớp chúng tôi có ba lưu học sinh nước ngoài.', NOW(), NOW()),
('山', 'shān', 'shan', 'Sơn', 'Họ', 1, 'HSK 3.0', '这座山真高。', 'Ngọn núi này thật là cao.', NOW(), NOW()),
('商场', 'shāngchǎng', 'shangchang', 'Thương Tràng', 'Trung tâm mua sắm; trung tâm thương mại', 1, 'HSK 3.0', '周末我们去商场购物。', 'Cuối tuần chúng tôi đến trung tâm thương mại mua sắm.', NOW(), NOW()),
('商店', 'shāngdiàn', 'shangdian', 'Thương Điếm', 'Cửa hàng; tiệm', 1, 'HSK 3.0', '他在商店买了一支笔。', 'Anh ấy mua một chiếc bút ở cửa hàng.', NOW(), NOW()),
('上', 'shàng', 'shang', 'Thướng', 'Lên; trên; đi làm; vào học', 1, 'HSK 3.0', '桌子上有一本汉语词典。', 'Trên bàn có một cuốn từ điển tiếng Trung.', NOW(), NOW()),
('上班', 'shàngbān', 'shangban', 'Thướng Ban', 'Đi làm; đi trực', 1, 'HSK 3.0', '爸爸每天早上八点去上班。', 'Bố mỗi buổi sáng tám giờ đi làm.', NOW(), NOW()),
('上边', 'shàngbian', 'shangbian', 'Thướng Biên', 'Phía trên; bên trên', 1, 'HSK 3.0', '书架上边摆放着奖状。', 'Phía trên giá sách bày các bằng khen.', NOW(), NOW()),
('上车', 'shàng chē', 'shang che', 'Thướng Xa', 'Lên', 1, 'HSK 3.0', '请大家排队有序上车。', 'Xin mọi người xếp hàng trật tự lên xe.', NOW(), NOW()),
('上次', 'shàng cì', 'shang ci', 'Thướng Thứ', 'Lần trước', 1, 'HSK 3.0', '上次见面还是一年前。', 'Lần trước gặp nhau vẫn là một năm trước.', NOW(), NOW()),
('上课', 'shàngkè', 'shangke', 'Thướng Khoá', 'Đi học; tham dự lớp', 1, 'HSK 3.0', '我们八点开始上课。', 'Chúng tôi tám giờ bắt đầu vào học.', NOW(), NOW()),
('上网', 'shàngwǎng', 'shangwang', 'Thướng Võng', 'Lên mạng; kết nối Internet', 1, 'HSK 3.0', '他喜欢在网上看新闻。', 'Anh ấy thích lên mạng xem tin tức.', NOW(), NOW()),
('上午', 'shàngwǔ', 'shangwu', 'Thướng Ngọ', 'Buổi sáng', 1, 'HSK 3.0', '今天上午我有三节汉语课。', 'Sáng hôm nay tôi có ba tiết học tiếng Trung.', NOW(), NOW()),
('上学', 'shàngxué', 'shangxue', 'Thướng Học', 'Đi học; theo học', 1, 'HSK 3.0', '孩子们背着书包去上学。', 'Lũ trẻ đeo cặp sách đi học.', NOW(), NOW()),
('少', 'shǎo', 'shao', 'Thiểu', 'Ít; thiếu', 1, 'HSK 3.0', '今天来上课的人很少。', 'Hôm nay người đến lớp học rất ít.', NOW(), NOW()),
('谁', 'shéi/shuí', 'shei/shui', 'Thuỳ', 'Ai; cũng đọc là', 1, 'HSK 3.0', '请问那位老师是谁？', 'Xin hỏi vị thầy giáo kia là ai vậy?', NOW(), NOW()),
('身上', 'shēnshang', 'shenshang', 'Thân Thướng', 'Trên cơ thể; trong tay', 1, 'HSK 3.0', '他身上穿了一件黑外套。', 'Trên người anh ấy mặc một chiếc áo khoác đen.', NOW(), NOW()),
('身体', 'shēntǐ', 'shenti', 'Thân Thể', 'Cơ thể; sức khỏe', 1, 'HSK 3.0', '祝你身体健康，万事如意。', 'Chúc bạn sức khỏe dồi dào, vạn sự như ý.', NOW(), NOW()),
('什么', 'shénme', 'shenme', 'Thậm Yêu', 'Gì?; điều gì đó; bất kỳ điều gì', 1, 'HSK 3.0', '你想买什么东西？', 'Bạn muốn mua đồ gì?', NOW(), NOW()),
('生病', 'shēngbìng', 'shengbing', 'Sinh Bệnh', 'Bị ốm', 1, 'HSK 3.0', '天气变冷了，小心生病。', 'Thời tiết trở lạnh rồi, cẩn thận kẻo ốm đấy.', NOW(), NOW()),
('生气', 'shēngqì', 'shengqi', 'Sinh Khí', 'Nổi giận; tức giận; sinh khí; sức sống', 1, 'HSK 3.0', '不要为这点小事生气。', 'Đừng vì chuyện nhỏ nhặt này mà tức giận.', NOW(), NOW()),
('生日', 'shēngrì', 'shengri', 'Sinh Nhật', 'Sinh nhật', 1, 'HSK 3.0', '今天是我的生日。', 'Hôm nay là sinh nhật của tôi.', NOW(), NOW()),
('十', 'shí', 'shi', 'Thập', 'Mười; 10', 1, 'HSK 3.0', '十个学生在操场上打球。', 'Mười học sinh đang chơi bóng trên sân.', NOW(), NOW()),
('时候', 'shíhou', 'shihou', 'Thời Hậu', 'Thời gian; khoảng thời gian', 1, 'HSK 3.0', '你什么时候去北京？', 'Khi nào bạn đi Bắc Kinh?', NOW(), NOW()),
('时间', 'shíjiān', 'shijian', 'Thời Gian', 'Thời gian', 1, 'HSK 3.0', '我们没有太多时间了。', 'Chúng ta không còn nhiều thời gian nữa.', NOW(), NOW()),
('事', 'shì', 'shi', 'Sự', 'Sự việc; điều', 1, 'HSK 3.0', '今天你有什么事吗？', 'Hôm nay bạn có việc gì không?', NOW(), NOW()),
('试', 'shì', 'shi', 'Thí', 'Thử; thí nghiệm', 1, 'HSK 3.0', '这件衣服你可以试一下。', 'Bộ quần áo này bạn có thể mặc thử một chút.', NOW(), NOW()),
('是', 'shì', 'shi', 'Thị', 'Là; đúng; phải; thật', 1, 'HSK 3.0', '我是河内大学的学生。', 'Tôi là sinh viên trường Đại học Hà Nội.', NOW(), NOW()),
('是不是', 'shì bu shì', 'shi bu shi', 'Thị Bất Thị', 'Có phải hay không; phải hoặc không', 1, 'HSK 3.0', '你是不是今天下午要去图书馆？', 'Có phải chiều nay bạn sẽ đi thư viện không?', NOW(), NOW()),
('手', 'shǒu', 'shou', 'Thủ', 'Tay; cầm', 1, 'HSK 3.0', '饭前洗手是个好习惯。', 'Rửa tay trước khi ăn là thói quen tốt.', NOW(), NOW()),
('手机', 'shǒujī', 'shouji', 'Thủ Cơ', 'Điện thoại di động', 1, 'HSK 3.0', '我的手机放在桌子上了。', 'Điện thoại của tôi để trên bàn rồi.', NOW(), NOW()),
('书', 'shū', 'shu', 'Thư', 'Viết tắt của 書經|书经', 1, 'HSK 3.0', '看书。', 'Đọc sách.', NOW(), NOW()),
('书包', 'shūbāo', 'shubao', 'Thư Bao', 'Cặp sách; cặp đeo lưng', 1, 'HSK 3.0', '新书包里装满了课本和笔。', 'Trong chiếc cặp sách mới chứa đầy sách vở và bút.', NOW(), NOW()),
('书店', 'shūdiàn', 'shudian', 'Thư Điếm', 'Nhà sách', 1, 'HSK 3.0', '我们在学校门口的新华书店见面。', 'Chúng tôi gặp nhau ở hiệu sách Tân Hoa trước cổng trường.', NOW(), NOW()),
('树', 'shù', 'shu', 'Thụ', 'Cây; trồng', 1, 'HSK 3.0', '校园里种着许多高大的绿树。', 'Trong khuôn viên trường trồng rất nhiều cây xanh cao lớn.', NOW(), NOW()),
('水', 'shuǐ', 'shui', 'Thuỷ', 'Họ', 1, 'HSK 3.0', '多喝温水对身体好。', 'Uống nhiều nước ấm rất tốt cho cơ thể.', NOW(), NOW()),
('水果', 'shuǐguǒ', 'shuiguo', 'Thuỷ Quả', 'Trái cây', 1, 'HSK 3.0', '多吃新鲜水果有益健康。', 'Ăn nhiều hoa quả tươi có lợi cho sức khỏe.', NOW(), NOW()),
('睡', 'shuì', 'shui', 'Thuỵ', 'Ngủ; nằm xuống', 1, 'HSK 3.0', '昨天晚上我睡得非常香甜。', 'Tối hôm qua tôi đã ngủ rất ngon giấc.', NOW(), NOW()),
('睡觉', 'shuìjiào', 'shuijiao', 'Thuỵ Giáo', 'Đi ngủ; ngủ', 1, 'HSK 3.0', '早点睡觉，明天还要早起。', 'Ngủ sớm đi, ngày mai còn phải dậy sớm.', NOW(), NOW()),
('说', 'shuō', 'shuo', 'Thuyết', 'Nói', 1, 'HSK 3.0', '老师说汉语说得很清楚。', 'Thầy giáo nói tiếng Trung rất rõ ràng.', NOW(), NOW()),
('说话', 'shuōhuà', 'shuohua', 'Thuyết Thoại', 'Nói; trò chuyện', 1, 'HSK 3.0', '请大家安静，不要说话。', 'Xin mọi người hãy giữ trật tự, đừng nói chuyện.', NOW(), NOW()),
('四', 'sì', 'si', 'Tứ', 'Bốn; 4', 1, 'HSK 3.0', '一年有四个季节。', 'Một năm có bốn mùa.', NOW(), NOW()),
('送', 'sòng', 'song', 'Tống', 'Gửi; giao; truyền; tặng', 1, 'HSK 3.0', '朋友送了我一本很有趣的书。', 'Bạn bè đã tặng tôi một cuốn sách rất thú vị.', NOW(), NOW()),
('岁', 'suì', 'sui', 'Tuế', 'Tuổi', 1, 'HSK 3.0', '小妹妹今年六岁了。', 'Em gái nhỏ năm nay sáu tuổi rồi.', NOW(), NOW()),
('他', 'tā', 'ta', 'Tha', 'Anh ấy; ông ấy; khác', 1, 'HSK 3.0', '他是我的大学同学。', 'Anh ấy là bạn học đại học của tôi.', NOW(), NOW()),
('他们', 'tāmen', 'tamen', 'Tha Môn', 'Họ; bọn họ', 1, 'HSK 3.0', '他们正在操场上打篮球。', 'Bọn họ đang chơi bóng rổ trên sân tập.', NOW(), NOW()),
('她', 'tā', 'ta', 'Tha', 'Cô ấy', 1, 'HSK 3.0', '她是我们的汉语口语老师。', 'Cô ấy là giáo viên dạy khẩu ngữ tiếng Trung của chúng tôi.', NOW(), NOW()),
('她们', 'tāmen', 'tamen', 'Tha Môn', 'Họ; các cô ấy', 1, 'HSK 3.0', '她们都是来自越南的留学生。', 'Họ đều là những du học sinh đến từ Việt Nam.', NOW(), NOW()),
('太', 'tài', 'tai', 'Thái', 'Quá; lắm', 1, 'HSK 3.0', '这件衣服太漂亮了。', 'Chiếc áo này đẹp quá đi thôi.', NOW(), NOW()),
('天', 'tiān', 'tian', 'Thiên', 'Ngày; trời', 1, 'HSK 3.0', '今天天气晴朗，阳光明媚。', 'Hôm nay trời quang mây tạnh, ánh nắng chan hòa.', NOW(), NOW()),
('天气', 'tiānqì', 'tianqi', 'Thiên Khí', 'Thời tiết', 1, 'HSK 3.0', '今天天气非常好。', 'Hôm nay thời tiết vô cùng đẹp.', NOW(), NOW()),
('听', 'tīng', 'ting', 'Dẫn', 'Nghe', 1, 'HSK 3.0', '你喜欢听什么音乐？', 'Bạn thích nghe loại âm nhạc nào?', NOW(), NOW()),
('听到', 'tīngdào', 'tingdao', 'Dẫn Đáo', 'Nghe thấy', 1, 'HSK 3.0', '我听到了小鸟在歌唱。', 'Tôi nghe thấy tiếng chim hót véo von.', NOW(), NOW()),
('听见', 'tīngjiàn', 'tingjian', 'Dẫn Kiến', 'Nghe thấy', 1, 'HSK 3.0', '你听见老师说的话了吗？', 'Bạn có nghe thấy lời thầy nói không?', NOW(), NOW()),
('听写', 'tīngxiě', 'tingxie', 'Dẫn Tả', 'Viết chính tả; bài chính tả; chép lại bằng tai', 1, 'HSK 3.0', '明天上课有生词听写。', 'Ngày mai vào lớp có bài kiểm tra chính tả từ mới.', NOW(), NOW()),
('同学', 'tóngxué', 'tongxue', 'Đồng Học', 'Học cùng trường; bạn học', 1, 'HSK 3.0', '张明是我的同班同学。', 'Trương Minh là bạn cùng lớp của tôi.', NOW(), NOW()),
('图书馆', 'túshūguǎn', 'tushuguan', 'Đồ Thư Quán', 'Thư viện', 1, 'HSK 3.0', '图书馆里非常安静。', 'Trong thư viện vô cùng yên tĩnh.', NOW(), NOW()),
('外', 'wài', 'wai', 'Ngoại', 'Bên ngoài; thêm vào', 1, 'HSK 3.0', '外面的世界真大。', 'Thế giới bên ngoài thật rộng lớn.', NOW(), NOW()),
('外边', 'wàibian', 'waibian', 'Ngoại Biên', 'Bên ngoài; bề mặt ngoài', 1, 'HSK 3.0', '外面正在下大雨。', 'Bên ngoài trời đang mưa to.', NOW(), NOW()),
('外国', 'wàiguó', 'waiguo', 'Ngoại Quốc', 'Nước ngoài', 1, 'HSK 3.0', '他很喜欢去外国旅游。', 'Anh ấy rất thích đi du lịch nước ngoài.', NOW(), NOW()),
('外语', 'wàiyǔ', 'waiyu', 'Ngoại Ngữ', 'Ngôn ngữ nước ngoài; Lượng từ: 門|门', 1, 'HSK 3.0', '学好一门外语很有用。', 'Học giỏi một ngoại ngữ rất có ích.', NOW(), NOW()),
('玩儿', 'wánr', 'wanr', 'Ngoạn Nhân', 'Chơi; vui chơi', 1, 'HSK 3.0', '周末孩子们在公园玩儿。', 'Cuối tuần lũ trẻ vui chơi ở công viên.', NOW(), NOW()),
('晚', 'wǎn', 'wan', 'Vãn', 'Buổi tối; đêm', 1, 'HSK 3.0', '时间不早了，我该睡了。', 'Thời gian không còn sớm nữa, tôi nên ngủ thôi.', NOW(), NOW()),
('晚饭', 'wǎnfàn', 'wanfan', 'Vãn Phạn', 'Bữa tối; cơm tối', 1, 'HSK 3.0', '全家人一起吃丰盛的晚饭。', 'Cả gia đình cùng ăn bữa tối thịnh soạn.', NOW(), NOW()),
('晚上', 'wǎnshang', 'wanshang', 'Vãn Thướng', 'Buổi tối; đêm', 1, 'HSK 3.0', '晚上我常常在房间复习功课。', 'Buổi tối tôi thường ôn bài ở trong phòng.', NOW(), NOW()),
('网上', 'wǎng shang', 'wang shang', 'Võng Thướng', 'Trực tuyến', 1, 'HSK 3.0', '我喜欢在网上查阅中文学习资料。', 'Tôi thích tra cứu tài liệu học tiếng Trung trên mạng.', NOW(), NOW()),
('网友', 'wǎngyǒu', 'wangyou', 'Võng Hữu', 'Bạn online; người dùng Internet', 1, 'HSK 3.0', '他在互联网上结识了许多中国网友。', 'Anh ấy đã làm quen với nhiều bạn mạng Trung Quốc trên Internet.', NOW(), NOW()),
('忘', 'wàng', 'wang', 'Vong', 'Quên; bỏ qua', 1, 'HSK 3.0', '不要忘了带你的雨伞。', 'Đừng quên mang theo chiếc ô của bạn nhé.', NOW(), NOW()),
('忘记', 'wàngjì', 'wangji', 'Vong Ký', 'Quên', 1, 'HSK 3.0', '我忘记了他的电话号码。', 'Tôi quên mất số điện thoại của anh ấy rồi.', NOW(), NOW()),
('问', 'wèn', 'wen', 'Vấn', 'Hỏi', 1, 'HSK 3.0', '遇到不懂的问题要问老师。', 'Gặp câu hỏi không hiểu phải hỏi thầy giáo.', NOW(), NOW()),
('我', 'wǒ', 'wo', 'Ngã', 'Tôi; mình; của tôi', 1, 'HSK 3.0', '我是越南留学生。', 'Tôi là du học sinh Việt Nam.', NOW(), NOW()),
('我们', 'wǒmen', 'women', 'Ngã Môn', 'Chúng tôi; chúng ta; bản thân chúng ta; của chúng tôi', 1, 'HSK 3.0', '我们一起努力学好汉语。', 'Chúng ta cùng nỗ lực học giỏi tiếng Trung nhé.', NOW(), NOW()),
('五', 'wǔ', 'wu', 'Ngũ', 'Năm; 5', 1, 'HSK 3.0', '一个星期工作五天。', 'Một tuần làm việc năm ngày.', NOW(), NOW()),
('午饭', 'wǔfàn', 'wufan', 'Ngọ Phạn', 'Bữa trưa', 1, 'HSK 3.0', '中午我们去食堂吃午饭。', 'Buổi trưa chúng tôi đến nhà ăn dùng bữa trưa.', NOW(), NOW()),
('西', 'xī', 'xi', 'Tây', 'Phương Tây; tiếng Tây Ban Nha', 1, 'HSK 3.0', '太阳从西方落下。', 'Mặt trời lặn về hướng tây.', NOW(), NOW()),
('西边', 'xībian', 'xibian', 'Tây Biên', 'Phía tây; bên phía tây', 1, 'HSK 3.0', '学校西边有一家大医院。', 'Phía tây trường học có một bệnh viện lớn.', NOW(), NOW()),
('洗', 'xǐ', 'xi', 'Tẩy', 'Rửa; tắm; rửa ảnh', 1, 'HSK 3.0', '饭前要洗手。', 'Trước khi ăn cơm phải rửa tay.', NOW(), NOW()),
('洗手间', 'xǐshǒujiān', 'xishoujian', 'Tẩy Thủ Gian', 'Nhà vệ sinh; phòng vệ sinh', 1, 'HSK 3.0', '请问洗手间在几楼？', 'Xin hỏi nhà vệ sinh ở tầng mấy vậy?', NOW(), NOW()),
('喜欢', 'xǐhuan', 'xihuan', 'Hỷ Hoan', 'Thích; ưa thích', 1, 'HSK 3.0', '我很喜欢中国书法。', 'Tôi rất thích thư pháp Trung Hoa.', NOW(), NOW()),
('下', 'xià', 'xia', 'Hạ', 'Dưới; xuống; tan làm; tan học', 1, 'HSK 3.0', '下星期我们有期中考试。', 'Tuần sau chúng tôi có bài thi giữa kỳ.', NOW(), NOW()),
('下班', 'xiàbān', 'xiaban', 'Hạ Ban', 'Tan làm; tan ca', 1, 'HSK 3.0', '爸爸下午五点半下班。', 'Bố năm giờ rưỡi chiều tan sở.', NOW(), NOW()),
('下边', 'xiàbian', 'xiabian', 'Hạ Biên', 'Ở dưới; mặt dưới', 1, 'HSK 3.0', '桌子下边趴着一只小猫。', 'Dưới gầm bàn có một chú mèo con đang nằm.', NOW(), NOW()),
('下车', 'xià chē', 'xia che', 'Hạ Xa', 'Xuống', 1, 'HSK 3.0', '到站了，请乘客们下车。', 'Đến ga rồi, xin mời quý khách xuống xe.', NOW(), NOW()),
('下次', 'xià cì', 'xia ci', 'Hạ Thứ', 'Lần tới', 1, 'HSK 3.0', '下次有机会我们再聚。', 'Lần sau có cơ hội chúng ta lại tụ họp nhé.', NOW(), NOW()),
('下课', 'xiàkè', 'xiake', 'Hạ Khoá', 'Tan học; ra khỏi lớp', 1, 'HSK 3.0', '老师说下课了，大家休息吧。', 'Thầy giáo nói tan học rồi, mọi người nghỉ ngơi đi.', NOW(), NOW()),
('下午', 'xiàwǔ', 'xiawu', 'Hạ Ngọ', 'Buổi chiều; p.m.', 1, 'HSK 3.0', '今天下午天气很凉快。', 'Chiều hôm nay thời tiết rất mát mẻ.', NOW(), NOW()),
('下雨', 'xià yǔ', 'xia yu', 'Hạ Vũ', 'Trời mưa', 1, 'HSK 3.0', '外边下雨了，出门要带伞。', 'Bên ngoài trời mưa rồi, ra ngoài nhớ mang ô.', NOW(), NOW()),
('先', 'xiān', 'xian', 'Tiên', 'Trước; tiên quyết', 1, 'HSK 3.0', '你先请坐，我马上倒茶。', 'Bạn hãy ngồi trước đi, tôi đi rót trà ngay.', NOW(), NOW()),
('先生', 'xiānsheng', 'xiansheng', 'Tiên Sinh', 'Giáo viên; quý ông; ngài; ông', 1, 'HSK 3.0', '王先生是一位优秀的工程师。', 'Ông Vương là một kỹ sư xuất sắc.', NOW(), NOW()),
('现在', 'xiànzài', 'xianzai', 'Hiện Tại', 'Bây giờ; hiện tại', 1, 'HSK 3.0', '现在是北京时间上午九点。', 'Bây giờ là chín giờ sáng giờ Bắc Kinh.', NOW(), NOW()),
('想', 'xiǎng', 'xiang', 'Tưởng', 'Nghĩ; muốn; nhớ', 1, 'HSK 3.0', '我想学习汉语口语。', 'Tôi muốn học khẩu ngữ tiếng Trung.', NOW(), NOW()),
('小', 'xiǎo', 'xiao', 'Tiểu', 'Nhỏ; bé', 1, 'HSK 3.0', '这是一只可爱的小花猫。', 'Đây là một chú mèo hoa nhỏ đáng yêu.', NOW(), NOW()),
('小孩儿', 'xiǎoháir', 'xiaohair', 'Tiểu Hài Nhân', 'Biến thể er hoá của 小孩', 1, 'HSK 3.0', '公园里有很多快乐的小孩儿。', 'Trong công viên có rất nhiều đứa trẻ vui vẻ.', NOW(), NOW()),
('小姐', 'xiǎojiě', 'xiaojie', 'Tiểu Tỷ', 'Cô gái; cô', 1, 'HSK 3.0', '服务小姐态度非常热情。', 'Cô nhân viên phục vụ thái độ rất nhiệt tình.', NOW(), NOW()),
('小朋友', 'xiǎopéngyǒu', 'xiaopengyou', 'Tiểu Bằng Hữu', 'Trẻ em', 1, 'HSK 3.0', '小朋友们在操场上做游戏。', 'Các bạn nhỏ đang chơi trò chơi trên sân.', NOW(), NOW()),
('小时', 'xiǎoshí', 'xiaoshi', 'Tiểu Thời', 'Giờ; lượng từ: 個|个', 1, 'HSK 3.0', '从河内飞北京大约四个小时。', 'Từ Hà Nội bay đến Bắc Kinh khoảng bốn tiếng đồng hồ.', NOW(), NOW()),
('小学', 'xiǎoxué', 'xiaoxue', 'Tiểu Học', 'Trường tiểu học; trường cấp một', 1, 'HSK 3.0', '我妹妹在离家不远的小学上学。', 'Em gái tôi học ở trường tiểu học không xa nhà.', NOW(), NOW()),
('小学生', 'xiǎoxuéshēng', 'xiaoxuesheng', 'Tiểu Học Sinh', 'Học sinh tiểu học; trẻ em đi học', 1, 'HSK 3.0', '小学生每天早起去学校。', 'Học sinh tiểu học mỗi ngày đều dậy sớm đến trường.', NOW(), NOW()),
('笑', 'xiào', 'xiao', 'Tiếu', 'Biến thể cũ của 笑', 1, 'HSK 3.0', '她笑起来非常好看。', 'Cô ấy cười lên trông rất xinh đẹp.', NOW(), NOW()),
('写', 'xiě', 'xie', 'Tả', 'Viết', 1, 'HSK 3.0', '老师在黑板上写生词。', 'Thầy giáo viết từ mới lên trên bảng đen.', NOW(), NOW()),
('谢谢', 'xièxie', 'xiexie', 'Tạ Tạ', 'Cảm ơn; cảm ơn bạn', 1, 'HSK 3.0', '谢谢大家对我的关心。', 'Cảm ơn mọi người đã quan tâm đến tôi.', NOW(), NOW()),
('新', 'xīn', 'xin', 'Tân', 'Mới', 1, 'HSK 3.0', '新年新气象。', 'Năm mới khí sắc mới mẻ.', NOW(), NOW()),
('新年', 'xīnnián', 'xinnian', 'Tân Niên', 'Năm mới; Lượng từ: 個|个', 1, 'HSK 3.0', '祝大家新年快乐，万事如意！', 'Chúc mọi người năm mới vui vẻ, vạn sự như ý!', NOW(), NOW()),
('星期', 'xīngqī', 'xingqi', 'Tinh Kỳ', 'Tuần; ngày trong tuần', 1, 'HSK 3.0', '这个星期六我们去看电影。', 'Thứ bảy tuần này chúng tôi đi xem phim.', NOW(), NOW()),
('星期日', 'xīngqīrì', 'xingqiri', 'Tinh Kỳ Nhật', 'Chủ nhật', 1, 'HSK 3.0', '星期日我常常在家休息。', 'Chủ nhật tôi thường ở nhà nghỉ ngơi.', NOW(), NOW()),
('星期天', 'xīngqītiān', 'xingqitian', 'Tinh Kỳ Thiên', 'Chủ Nhật', 1, 'HSK 3.0', '星期天公园里游人很多。', 'Chủ nhật trong công viên có rất đông du khách.', NOW(), NOW()),
('行', 'xíng', 'xing', 'Hàng', 'Được; đi; thực hiện', 1, 'HSK 3.0', '如果你时间方便，这样就行。', 'Nếu thời gian của bạn thuận tiện, vậy thì được rồi.', NOW(), NOW()),
('休息', 'xiūxi', 'xiuxi', 'Hưu Tức', 'Nghỉ; nghỉ ngơi', 1, 'HSK 3.0', '工作累了就休息一会儿吧。', 'Làm việc mệt rồi thì nghỉ ngơi một lát đi thôi.', NOW(), NOW()),
('学', 'xué', 'xue', 'Học', 'Học; bắt chước', 1, 'HSK 3.0', '学好汉语需要每天坚持。', 'Học giỏi tiếng Trung cần kiên trì mỗi ngày.', NOW(), NOW()),
('学生', 'xuéshēng', 'xuesheng', 'Học Sinh', 'Học sinh; trẻ đi học', 1, 'HSK 3.0', '教室里坐满了用功的学生。', 'Trong phòng học ngồi kín những học sinh chăm chỉ.', NOW(), NOW()),
('学习', 'xuéxí', 'xuexi', 'Học Tập', 'Học; tìm hiểu', 1, 'HSK 3.0', '我们要努力学习科学文化知识。', 'Chúng ta phải nỗ lực học tập kiến thức khoa học văn hóa.', NOW(), NOW()),
('学校', 'xuéxiào', 'xuexiao', 'Học Hiệu', 'Trường học; Lượng từ: 所', 1, 'HSK 3.0', '我们的学校非常美丽。', 'Ngôi trường của chúng tôi vô cùng tươi đẹp.', NOW(), NOW()),
('学院', 'xuéyuàn', 'xueyuan', 'Học Viện', 'Trường cao đẳng; học viện', 1, 'HSK 3.0', '他在北京语言文化学院学习。', 'Anh ấy học ở Học viện Ngôn ngữ và Văn hóa Bắc Kinh.', NOW(), NOW()),
('要', 'yào', 'yao', 'Yêu', 'Muốn; cần; phải', 1, 'HSK 3.0', '明天我要去参加汉语考试。', 'Ngày mai tôi phải đi tham gia kỳ thi tiếng Trung.', NOW(), NOW()),
('爷爷', 'yéye', 'yeye', 'Gia Gia', 'Ông nội; ông bên nội', 1, 'HSK 3.0', '我爷爷每天早上打太极拳。', 'Ông nội tôi mỗi sáng đều tập Thái Cực Quyền.', NOW(), NOW()),
('也', 'yě', 'ye', 'Dã', 'Họ', 1, 'HSK 3.0', '他是大学生，我也是大学生。', 'Anh ấy là sinh viên, tôi cũng là sinh viên.', NOW(), NOW()),
('页', 'yè', 'ye', 'Hiệt', 'Đầu', 1, 'HSK 3.0', '请大家翻到课本第四十五页。', 'Xin mời mọi người lật tới trang 45 sách giáo khoa.', NOW(), NOW()),
('一', 'yī', 'yi', 'Nhất', 'Một; đơn', 1, 'HSK 3.0', '一人成木，二人成林。', 'Một người thành cây, hai người thành rừng.', NOW(), NOW()),
('衣服', 'yīfu', 'yifu', 'Y Phục', 'Quần áo', 1, 'HSK 3.0', '这件衣服款式很大方。', 'Chiếc áo này kiểu dáng rất nhã nhặn.', NOW(), NOW()),
('医生', 'yīshēng', 'yisheng', 'Y Sinh', 'Bác sĩ', 1, 'HSK 3.0', '医生认真地给病人检查身体。', 'Bác sĩ cẩn thận kiểm tra sức khỏe cho bệnh nhân.', NOW(), NOW()),
('医院', 'yīyuàn', 'yiyuan', 'Y Viện', 'Bệnh viện', 1, 'HSK 3.0', '市中心有一家现代化的大医院。', 'Ở trung tâm thành phố có một bệnh viện lớn hiện đại.', NOW(), NOW()),
('一半', 'yībàn', 'yiban', 'Nhất Bán', 'Một nửa', 1, 'HSK 3.0', '这个西瓜我们一人吃一半。', 'Quả dưa hấu này mỗi người chúng ta ăn một nửa.', NOW(), NOW()),
('一会儿', 'yīhuìr', 'yihuir', 'Nhất Hội Nhân', 'Một lúc; một thời gian', 1, 'HSK 3.0', '请大家稍等一会儿。', 'Xin mọi người hãy chờ một lát.', NOW(), NOW()),
('一块儿', 'yīkuàir', 'yikuair', 'Nhất Khối Nhân', 'Biến thể er hoá của 一塊|一块', 1, 'HSK 3.0', '周末我们一块儿去爬山吧。', 'Cuối tuần chúng ta cùng nhau đi leo núi nhé.', NOW(), NOW()),
('一下儿', 'yīxiàr', 'yixiar', 'Nhất Hạ Nhân', 'Biến thể er hoá của 一下', 1, 'HSK 3.0', '请大家稍等我一下儿。', 'Xin mọi người hãy chờ tôi một lát.', NOW(), NOW()),
('一样', 'yīyàng', 'yiyang', 'Nhất Dạng', 'Giống; như', 1, 'HSK 3.0', '他的性格跟他爸爸一样。', 'Tính cách của anh ấy giống y hệt như bố mình.', NOW(), NOW()),
('一边', 'yībiān', 'yibian', 'Nhất Biên', 'Một bên; mỗi bên', 1, 'HSK 3.0', '他一边听音乐，一边写作业。', 'Anh ấy vừa nghe nhạc, vừa làm bài tập.', NOW(), NOW()),
('一点儿', 'yīdiǎnr', 'yidianr', 'Nhất Điểm Nhân', 'Biến thể er hoá của 一點|一点', 1, 'HSK 3.0', '今天天气比昨天冷一点儿。', 'Hôm nay thời tiết hơi lạnh hơn hôm qua một chút.', NOW(), NOW()),
('一起', 'yīqǐ', 'yiqi', 'Nhất Khởi', 'Ở cùng một nơi; cùng nhau', 1, 'HSK 3.0', '我们一起努力提高汉语水平。', 'Chúng ta cùng nhau nỗ lực nâng cao trình độ tiếng Trung.', NOW(), NOW()),
('一些', 'yīxiē', 'yixie', 'Nhất Ta', 'Một số; một vài', 1, 'HSK 3.0', '桌子上放着一些新鲜的水果。', 'Trên bàn bày một số hoa quả tươi ngon.', NOW(), NOW()),
('用', 'yòng', 'yong', 'Dụng', 'Dùng; sử dụng', 1, 'HSK 3.0', '请大家用汉语回答老师的问题。', 'Xin mời mọi người dùng tiếng Trung trả lời câu hỏi của thầy giáo.', NOW(), NOW()),
('有', 'yǒu', 'you', 'Hữu', 'Có', 1, 'HSK 3.0', '图书馆里有许多中文书籍。', 'Trong thư viện có rất nhiều sách báo tiếng Trung.', NOW(), NOW()),
('有的', 'yǒude', 'youde', 'Hữu Đích', 'Một số', 1, 'HSK 3.0', '有的同学在看书，有的在听音乐。', 'Có bạn học sinh đang đọc sách, có bạn lại đang nghe nhạc.', NOW(), NOW()),
('有名', 'yǒumíng', 'youming', 'Hữu Danh', 'Nổi tiếng; được biết đến', 1, 'HSK 3.0', '北京烤鸭是闻名世界的中国名菜。', 'Vịt quay Bắc Kinh là món ăn nổi tiếng khắp thế giới của Trung Quốc.', NOW(), NOW()),
('有时候', 'yǒushíhou', 'youshihou', 'Hữu Thời Hậu', 'Đôi khi', 1, 'HSK 3.0', '周末有时候我喜欢一个人去散步。', 'Cuối tuần đôi khi tôi thích đi dạo một mình.', NOW(), NOW()),
('有些', 'yǒu(yī)xiē', 'you(yi)xie', 'Hữu Ta', 'Một số; hơi', 1, 'HSK 3.0', '这些问题有些难，需要仔细分析。', 'Những vấn đề này hơi khó, cần phân tích cẩn thận.', NOW(), NOW()),
('有用', 'yǒuyòng', 'youyong', 'Hữu Dụng', 'Hữu ích', 1, 'HSK 3.0', '掌握这门技术非常有用。', 'Nắm vững kỹ thuật này vô cùng hữu ích.', NOW(), NOW()),
('右', 'yòu', 'you', 'Hữu', 'Phải; bên phải', 1, 'HSK 3.0', '请向右看齐。', 'Xin hãy nhìn sang bên phải gióng hàng.', NOW(), NOW()),
('右边', 'yòubian', 'youbian', 'Hữu Biên', 'Bên phải; phải, về bên phải', 1, 'HSK 3.0', '学校的右边是一家大超市。', 'Bên phải trường học là một siêu thị lớn.', NOW(), NOW()),
('雨', 'yǔ', 'yu', 'Vũ', 'Mưa; Lượng từ: 陣|阵, 場|场', 1, 'HSK 3.0', '外面的雨渐渐停了。', 'Cơn mưa bên ngoài dần dần tạnh rồi.', NOW(), NOW()),
('元', 'yuán', 'yuan', 'Nguyên', 'Họ; triều Nguyên', 1, 'HSK 3.0', '这本词典售价五十元。', 'Cuốn từ điển này giá bán năm mươi tệ.', NOW(), NOW()),
('远', 'yuǎn', 'yuan', 'Viễn', 'Xa; xa xôi', 1, 'HSK 3.0', '从我家到学校并不远。', 'Từ nhà tôi đến trường học không hề xa.', NOW(), NOW()),
('月', 'yuè', 'yue', 'Nguyệt', 'Mặt trăng; tháng', 1, 'HSK 3.0', '九月是学生们开学的月份。', 'Tháng chín là tháng học sinh bắt đầu năm học mới.', NOW(), NOW()),
('再', 'zài', 'zai', 'Tái', 'Lại; một lần nữa; tái-; lần thứ hai; cái khác', 1, 'HSK 3.0', '欢迎大家下次再来。', 'Hoan nghênh mọi người lần sau lại đến.', NOW(), NOW()),
('再见', 'zàijiàn', 'zaijian', 'Tái Kiến', 'Tạm biệt; gặp lại sau', 1, 'HSK 3.0', '老师再见，明天见！', 'Chào tạm biệt thầy cô, hẹn ngày mai gặp lại!', NOW(), NOW()),
('在', 'zài', 'zai', 'Tại', 'Ở; tại; đang', 1, 'HSK 3.0', '我现在在图书馆查资料。', 'Bây giờ tôi đang ở thư viện tra cứu tài liệu.', NOW(), NOW()),
('在家', 'zàijiā', 'zaijia', 'Tại Gia', 'Ở nhà; có mặt', 1, 'HSK 3.0', '星期天我整天都在家看书。', 'Chủ nhật tôi cả ngày đều ở nhà đọc sách.', NOW(), NOW()),
('早', 'zǎo', 'zao', 'Tảo', 'Sớm; buổi sáng', 1, 'HSK 3.0', '早起的鸟儿有虫吃。', 'Chim dậy sớm mới có sâu ăn.', NOW(), NOW()),
('早饭', 'zǎofàn', 'zaofan', 'Tảo Phạn', 'Bữa sáng', 1, 'HSK 3.0', '妈妈已经为我们做好了早饭。', 'Mẹ đã chuẩn bị xong bữa sáng cho chúng tôi rồi.', NOW(), NOW()),
('早上', 'zǎoshang', 'zaoshang', 'Tảo Thướng', 'Buổi sáng sớm', 1, 'HSK 3.0', '早上空气格外清新。', 'Buổi sáng không khí đặc biệt trong lành.', NOW(), NOW()),
('怎么', 'zěnme', 'zenme', 'Chẩm Yêu', 'Như thế nào?; cái gì?', 1, 'HSK 3.0', '这个生词怎么读？', 'Từ mới này phát âm như thế nào?', NOW(), NOW()),
('站', 'zhàn', 'zhan', 'Trạm', 'Trạm; đứng', 1, 'HSK 3.0', '下一站就是天安门广场。', 'Trạm tiếp theo chính là Quảng trường Thiên An Môn.', NOW(), NOW()),
('找', 'zhǎo', 'zhao', 'Trảo', 'Tìm; kiếm; thối lại tiền', 1, 'HSK 3.0', '你在找什么重要的东西？', 'Bạn đang tìm đồ vật quan trọng gì thế?', NOW(), NOW()),
('找到', 'zhǎodào', 'zhaodao', 'Trảo Đáo', 'Tìm thấy', 1, 'HSK 3.0', '我终于找到了丢失的钱包。', 'Cuối cùng tôi cũng tìm thấy chiếc ví tiền bị mất.', NOW(), NOW()),
('这', 'zhè', 'zhe', 'Giá', 'Này; những...này; này', 1, 'HSK 3.0', '这是我最喜欢的一本书。', 'Đây là cuốn sách mà tôi yêu thích nhất.', NOW(), NOW()),
('这边', 'zhèbiān', 'zhebian', 'Giá Biên', 'Bên này; ở đây', 1, 'HSK 3.0', '请大家往这边走。', 'Xin mời mọi người đi sang phía bên này.', NOW(), NOW()),
('这里', 'zhèlǐ', 'zheli', 'Giá Lý', 'Biến thể của 這裡|这里', 1, 'HSK 3.0', '这里的风景非常迷人。', 'Phong cảnh ở nơi đây vô cùng say đắm lòng người.', NOW(), NOW()),
('这儿', 'zhèr', 'zher', 'Giá Nhân', 'Ở đây', 1, 'HSK 3.0', '这儿有很多来自各地的朋友。', 'Ở đây có rất nhiều bạn bè đến từ khắp nơi.', NOW(), NOW()),
('这些', 'zhèxiē', 'zhexie', 'Giá Ta', 'Những... này', 1, 'HSK 3.0', '这些生词大家都要熟记。', 'Những từ mới này mọi người đều phải ghi nhớ thật kỹ.', NOW(), NOW()),
('着', 'zhe', 'zhe', 'Trước', 'Đang (trợ từ biểu thị trạng thái tiếp diễn)', 1, 'HSK 3.0', '门开着，请直接进来。', 'Cửa đang mở, xin mời trực tiếp bước vào.', NOW(), NOW()),
('真', 'zhēn', 'zhen', 'Chân', 'Thật; sự thật', 1, 'HSK 3.0', '今天大家聚在一起真开心。', 'Hôm nay mọi người tụ họp bên nhau thật là vui.', NOW(), NOW()),
('真的', 'zhēn de', 'zhen de', 'Chân Đích', 'Thực sự; thật sự; quả thật; thật; đúng; chính xác', 1, 'HSK 3.0', '这件传统中国旗袍真的很漂亮。', 'Chiếc áo dài sườn xám này thật sự rất đẹp.', NOW(), NOW()),
('正', 'zhèng', 'zheng', 'Chinh', 'Đúng; chính; đang', 1, 'HSK 3.0', '太阳正当空照着大地。', 'Mặt trời đang chiếu rọi ngay trên đỉnh đầu xuống mặt đất.', NOW(), NOW()),
('正在', 'zhèngzài', 'zhengzai', 'Chinh Tại', 'Đang ở; ngay tại', 1, 'HSK 3.0', '爸爸正在书房里认真阅读报纸。', 'Bố đang chăm chú đọc báo trong phòng sách.', NOW(), NOW()),
('知道', 'zhīdào', 'zhidao', 'Tri Đạo', 'Biết; nhận thức được; cũng đọc là', 1, 'HSK 3.0', '你知道去火车站的路怎么走吗？', 'Bạn có biết đường đi đến nhà ga xe lửa không?', NOW(), NOW()),
('知识', 'zhīshi', 'zhishi', 'Tri Thức', 'Kiến thức; trí thức', 1, 'HSK 3.0', '书籍是人类进步的阶梯和知识的源泉。', 'Sách là bậc thang tiến bộ và nguồn tri thức của nhân loại.', NOW(), NOW()),
('中', 'zhōng', 'zhong', 'Trung', 'Trong; giữa; trúng', 1, 'HSK 3.0', '汉语在国际交流中越来越重要。', 'Tiếng Trung ngày càng quan trọng trong giao lưu quốc tế.', NOW(), NOW()),
('中国', 'Zhōngguó', 'zhongguo', 'Trung Quốc', 'Trung Quốc', 1, 'HSK 3.0', '我想去中国北京留学。', 'Tôi muốn đi du học ở Bắc Kinh, Trung Quốc.', NOW(), NOW()),
('中间', 'zhōngjiān', 'zhongjian', 'Trung Gian', 'Ở giữa; bên trong; ở giữa; trong; giữa; trong số', 1, 'HSK 3.0', '他在人群中间向我们招手。', 'Anh ấy ở giữa đám đông vẫy tay chào chúng tôi.', NOW(), NOW()),
('中文', 'Zhōngwén', 'zhongwen', 'Trung Văn', 'Ngôn ngữ Trung Quốc', 1, 'HSK 3.0', '学好中文可以了解博大精深的中国文化。', 'Học tốt tiếng Trung có thể hiểu được văn hóa Trung Hoa sâu rộng.', NOW(), NOW()),
('中午', 'zhōngwǔ', 'zhongwu', 'Trung Ngọ', 'Buổi trưa; trưa', 1, 'HSK 3.0', '中午我们在学校食堂吃午饭。', 'Buổi trưa chúng tôi ăn cơm trưa ở nhà ăn trường.', NOW(), NOW()),
('中学', 'zhōngxué', 'zhongxue', 'Trung Học', 'Trường trung học', 1, 'HSK 3.0', '我弟弟正在一所重点中学读书。', 'Em trai tôi đang học ở một trường trung học trọng điểm.', NOW(), NOW()),
('中学生', 'zhōngxuéshēng', 'zhongxuesheng', 'Trung Học Sinh', 'Học sinh trung học; học sinh cấp ba', 1, 'HSK 3.0', '中学生要认真学好各门课程。', 'Học sinh trung học cần chăm chỉ học tốt các môn học.', NOW(), NOW()),
('重', 'zhòng', 'zhong', 'Trùng', 'Lặp lại; sự lặp lại', 1, 'HSK 3.0', '这个箱子非常重，我搬不动。', 'Chiếc hòm này rất nặng, tôi bê không nổi.', NOW(), NOW()),
('重要', 'zhòngyào', 'zhongyao', 'Trùng Yêu', 'Quan trọng; đáng kể; chính yếu', 1, 'HSK 3.0', '身体健康比什么都重要。', 'Sức khỏe tốt quan trọng hơn bất cứ thứ gì.', NOW(), NOW()),
('住', 'zhù', 'zhu', 'Trú', 'Ở; cư trú', 1, 'HSK 3.0', '他住在留学生宿舍三号楼。', 'Anh ấy ở tại tòa nhà số 3 ký túc xá lưu học sinh.', NOW(), NOW()),
('准备', 'zhǔnbèi', 'zhunbei', 'Chuẩn Bị', 'Sự chuẩn bị; chuẩn bị', 1, 'HSK 3.0', '我们正在认真准备期末考试。', 'Chúng tôi đang chăm chỉ chuẩn bị cho kỳ thi cuối kỳ.', NOW(), NOW()),
('桌子', 'zhuōzi', 'zhuozi', 'Trác Tử', 'Bàn; bàn làm việc', 1, 'HSK 3.0', '教室里摆放着整齐的桌子和椅子。', 'Trong lớp học xếp những bộ bàn ghế ngay ngắn.', NOW(), NOW()),
('字', 'zì', 'zi', 'Tự', 'Chữ; ký hiệu', 1, 'HSK 3.0', '这个中国汉字写得非常漂亮。', 'Chữ Hán này được viết vô cùng đẹp đẽ.', NOW(), NOW()),
('子', 'zi (zhuōzi)', 'zi (zhuozi)', 'Tử', 'Con trai; trẻ em', 1, 'HSK 3.0', '桌子上摆放着几个精致的杯子。', 'Trên bàn đặt mấy chiếc cốc tinh xảo.', NOW(), NOW()),
('走', 'zǒu', 'zou', 'Tẩu', 'Đi; rời đi', 1, 'HSK 3.0', '天色已晚，我们该走了。', 'Trời đã tối rồi, chúng ta nên đi thôi.', NOW(), NOW()),
('走路', 'zǒulù', 'zoulu', 'Tẩu Lộ', 'Đi bộ; đi bằng chân', 1, 'HSK 3.0', '每天走路半小时对心脏很有益。', 'Mỗi ngày đi bộ nửa giờ rất có ích cho tim mạch.', NOW(), NOW()),
('最', 'zuì', 'zui', 'Tối', 'Nhất', 1, 'HSK 3.0', '汉语是我最喜欢的外国语言。', 'Tiếng Trung là ngoại ngữ mà tôi yêu thích nhất.', NOW(), NOW()),
('最好', 'zuìhǎo', 'zuihao', 'Tối Hảo', 'Tốt nhất; nên ...; tốt hơn hết nên ...', 1, 'HSK 3.0', '身体不舒服时最好去医院看医生。', 'Khi cơ thể không khỏe tốt nhất nên đến bệnh viện khám bác sĩ.', NOW(), NOW()),
('最后', 'zuìhòu', 'zuihou', 'Tối Hậu', 'Cuối cùng; sau cùng', 1, 'HSK 3.0', '经过大家努力，我们最后取得了胜利。', 'Qua sự nỗ lực của mọi người, cuối cùng chúng tôi đã giành thắng lợi.', NOW(), NOW()),
('昨天', 'zuótiān', 'zuotian', 'Tạc Thiên', 'Hôm qua', 1, 'HSK 3.0', '昨天我和好朋友一起去了博物馆。', 'Hôm qua tôi và bạn thân đã cùng nhau đi viện bảo tàng.', NOW(), NOW()),
('左', 'zuǒ', 'zuo', 'Tả', 'Trái; bên trái', 1, 'HSK 3.0', '请各位同学向左转。', 'Xin mời các bạn học sinh quay sang trái.', NOW(), NOW()),
('左边', 'zuǒbian', 'zuobian', 'Tả Biên', 'Bên trái; phía trái', 1, 'HSK 3.0', '学校图书馆在办公楼的左边。', 'Thư viện trường học nằm ở phía bên trái tòa nhà làm việc.', NOW(), NOW()),
('坐', 'zuò', 'zuo', 'Toạ', 'Ngồi; đi (xe, tàu)', 1, 'HSK 3.0', '请大家按座位号坐下。', 'Xin mời mọi người theo số ghế ngồi xuống.', NOW(), NOW()),
('坐下', 'zuò xia', 'zuo xia', 'Toạ Hạ', 'Ngồi xuống', 1, 'HSK 3.0', '老师走进教室，请大家安静坐下。', 'Thầy giáo bước vào lớp, xin mời mọi người trật tự ngồi xuống.', NOW(), NOW()),
('做', 'zuò', 'zuo', 'Tố', 'Làm; chế tạo', 1, 'HSK 3.0', '周末你通常在家做什么？', 'Cuối tuần bạn thường làm gì ở nhà?', NOW(), NOW())
ON DUPLICATE KEY UPDATE
    `hsk_level` = VALUES(`hsk_level`),
    `hsk_standard` = VALUES(`hsk_standard`),
    `meaning_han_viet` = VALUES(`meaning_han_viet`),
    `meaning_vi` = VALUES(`meaning_vi`),
    `example_sentence` = COALESCE(`VOCABULARY`.`example_sentence`, VALUES(`example_sentence`)),
    `example_translation` = COALESCE(`VOCABULARY`.`example_translation`, VALUES(`example_translation`)),
    `updated_at` = NOW();

-- 2. Seed 804 VOCAB_RADICAL Relations
INSERT IGNORE INTO `VOCAB_RADICAL` (`vocab_id`, `radical_id`)
SELECT v.`vocab_id`, mapping.`radical_id`
FROM (
    SELECT '爱' AS `hanzi`, 'ai' AS `pinyin_raw`, 87 AS `radical_id`
    UNION ALL
    SELECT '爱好' AS `hanzi`, 'aihao' AS `pinyin_raw`, 38 AS `radical_id`
    UNION ALL
    SELECT '爱好' AS `hanzi`, 'aihao' AS `pinyin_raw`, 87 AS `radical_id`
    UNION ALL
    SELECT '八' AS `hanzi`, 'ba' AS `pinyin_raw`, 12 AS `radical_id`
    UNION ALL
    SELECT '爸爸' AS `hanzi`, 'baba' AS `pinyin_raw`, 88 AS `radical_id`
    UNION ALL
    SELECT '吧' AS `hanzi`, 'ba' AS `pinyin_raw`, 30 AS `radical_id`
    UNION ALL
    SELECT '白' AS `hanzi`, 'bai' AS `pinyin_raw`, 106 AS `radical_id`
    UNION ALL
    SELECT '白天' AS `hanzi`, 'baitian' AS `pinyin_raw`, 37 AS `radical_id`
    UNION ALL
    SELECT '白天' AS `hanzi`, 'baitian' AS `pinyin_raw`, 106 AS `radical_id`
    UNION ALL
    SELECT '百' AS `hanzi`, 'bai' AS `pinyin_raw`, 106 AS `radical_id`
    UNION ALL
    SELECT '班' AS `hanzi`, 'ban' AS `pinyin_raw`, 96 AS `radical_id`
    UNION ALL
    SELECT '半' AS `hanzi`, 'ban' AS `pinyin_raw`, 24 AS `radical_id`
    UNION ALL
    SELECT '半年' AS `hanzi`, 'ban nian' AS `pinyin_raw`, 24 AS `radical_id`
    UNION ALL
    SELECT '半年' AS `hanzi`, 'ban nian' AS `pinyin_raw`, 51 AS `radical_id`
    UNION ALL
    SELECT '半天' AS `hanzi`, 'bantian' AS `pinyin_raw`, 24 AS `radical_id`
    UNION ALL
    SELECT '半天' AS `hanzi`, 'bantian' AS `pinyin_raw`, 37 AS `radical_id`
    UNION ALL
    SELECT '帮' AS `hanzi`, 'bang' AS `pinyin_raw`, 50 AS `radical_id`
    UNION ALL
    SELECT '帮忙' AS `hanzi`, 'bangmang' AS `pinyin_raw`, 50 AS `radical_id`
    UNION ALL
    SELECT '帮忙' AS `hanzi`, 'bangmang' AS `pinyin_raw`, 61 AS `radical_id`
    UNION ALL
    SELECT '包' AS `hanzi`, 'bao' AS `pinyin_raw`, 20 AS `radical_id`
    UNION ALL
    SELECT '包子' AS `hanzi`, 'baozi' AS `pinyin_raw`, 20 AS `radical_id`
    UNION ALL
    SELECT '包子' AS `hanzi`, 'baozi' AS `pinyin_raw`, 39 AS `radical_id`
    UNION ALL
    SELECT '杯' AS `hanzi`, 'bei' AS `pinyin_raw`, 75 AS `radical_id`
    UNION ALL
    SELECT '杯子' AS `hanzi`, 'beizi' AS `pinyin_raw`, 39 AS `radical_id`
    UNION ALL
    SELECT '杯子' AS `hanzi`, 'beizi' AS `pinyin_raw`, 75 AS `radical_id`
    UNION ALL
    SELECT '北' AS `hanzi`, 'bei' AS `pinyin_raw`, 21 AS `radical_id`
    UNION ALL
    SELECT '北边' AS `hanzi`, 'beibian' AS `pinyin_raw`, 21 AS `radical_id`
    UNION ALL
    SELECT '北边' AS `hanzi`, 'beibian' AS `pinyin_raw`, 162 AS `radical_id`
    UNION ALL
    SELECT '北京' AS `hanzi`, 'beijing' AS `pinyin_raw`, 8 AS `radical_id`
    UNION ALL
    SELECT '北京' AS `hanzi`, 'beijing' AS `pinyin_raw`, 21 AS `radical_id`
    UNION ALL
    SELECT '本' AS `hanzi`, 'ben' AS `pinyin_raw`, 75 AS `radical_id`
    UNION ALL
    SELECT '本子' AS `hanzi`, 'benzi' AS `pinyin_raw`, 39 AS `radical_id`
    UNION ALL
    SELECT '本子' AS `hanzi`, 'benzi' AS `pinyin_raw`, 75 AS `radical_id`
    UNION ALL
    SELECT '比' AS `hanzi`, 'bi' AS `pinyin_raw`, 81 AS `radical_id`
    UNION ALL
    SELECT '别' AS `hanzi`, 'bie' AS `pinyin_raw`, 18 AS `radical_id`
    UNION ALL
    SELECT '别的' AS `hanzi`, 'biede' AS `pinyin_raw`, 18 AS `radical_id`
    UNION ALL
    SELECT '别的' AS `hanzi`, 'biede' AS `pinyin_raw`, 106 AS `radical_id`
    UNION ALL
    SELECT '别人' AS `hanzi`, 'bieren' AS `pinyin_raw`, 9 AS `radical_id`
    UNION ALL
    SELECT '别人' AS `hanzi`, 'bieren' AS `pinyin_raw`, 18 AS `radical_id`
    UNION ALL
    SELECT '病' AS `hanzi`, 'bing' AS `pinyin_raw`, 104 AS `radical_id`
    UNION ALL
    SELECT '病人' AS `hanzi`, 'bingren' AS `pinyin_raw`, 9 AS `radical_id`
    UNION ALL
    SELECT '病人' AS `hanzi`, 'bingren' AS `pinyin_raw`, 104 AS `radical_id`
    UNION ALL
    SELECT '不大' AS `hanzi`, 'bu da' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '不大' AS `hanzi`, 'bu da' AS `pinyin_raw`, 37 AS `radical_id`
    UNION ALL
    SELECT '不对' AS `hanzi`, 'budui' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '不对' AS `hanzi`, 'budui' AS `pinyin_raw`, 41 AS `radical_id`
    UNION ALL
    SELECT '不客气' AS `hanzi`, 'bu keqi' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '不客气' AS `hanzi`, 'bu keqi' AS `pinyin_raw`, 40 AS `radical_id`
    UNION ALL
    SELECT '不客气' AS `hanzi`, 'bu keqi' AS `pinyin_raw`, 84 AS `radical_id`
    UNION ALL
    SELECT '不用' AS `hanzi`, 'buyong' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '不用' AS `hanzi`, 'buyong' AS `pinyin_raw`, 101 AS `radical_id`
    UNION ALL
    SELECT '不' AS `hanzi`, 'bu' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '菜' AS `hanzi`, 'cai' AS `pinyin_raw`, 140 AS `radical_id`
    UNION ALL
    SELECT '茶' AS `hanzi`, 'cha' AS `pinyin_raw`, 140 AS `radical_id`
    UNION ALL
    SELECT '差' AS `hanzi`, 'cha' AS `pinyin_raw`, 48 AS `radical_id`
    UNION ALL
    SELECT '常' AS `hanzi`, 'chang' AS `pinyin_raw`, 50 AS `radical_id`
    UNION ALL
    SELECT '常常' AS `hanzi`, 'changchang' AS `pinyin_raw`, 50 AS `radical_id`
    UNION ALL
    SELECT '唱' AS `hanzi`, 'chang' AS `pinyin_raw`, 30 AS `radical_id`
    UNION ALL
    SELECT '唱歌' AS `hanzi`, 'changge' AS `pinyin_raw`, 30 AS `radical_id`
    UNION ALL
    SELECT '唱歌' AS `hanzi`, 'changge' AS `pinyin_raw`, 76 AS `radical_id`
    UNION ALL
    SELECT '车' AS `hanzi`, 'che' AS `pinyin_raw`, 159 AS `radical_id`
    UNION ALL
    SELECT '车票' AS `hanzi`, 'chepiao' AS `pinyin_raw`, 113 AS `radical_id`
    UNION ALL
    SELECT '车票' AS `hanzi`, 'chepiao' AS `pinyin_raw`, 159 AS `radical_id`
    UNION ALL
    SELECT '车上' AS `hanzi`, 'che shang' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '车上' AS `hanzi`, 'che shang' AS `pinyin_raw`, 159 AS `radical_id`
    UNION ALL
    SELECT '车站' AS `hanzi`, 'chezhan' AS `pinyin_raw`, 117 AS `radical_id`
    UNION ALL
    SELECT '车站' AS `hanzi`, 'chezhan' AS `pinyin_raw`, 159 AS `radical_id`
    UNION ALL
    SELECT '吃' AS `hanzi`, 'chi' AS `pinyin_raw`, 30 AS `radical_id`
    UNION ALL
    SELECT '吃饭' AS `hanzi`, 'chifan' AS `pinyin_raw`, 30 AS `radical_id`
    UNION ALL
    SELECT '吃饭' AS `hanzi`, 'chifan' AS `pinyin_raw`, 184 AS `radical_id`
    UNION ALL
    SELECT '出' AS `hanzi`, 'chu' AS `pinyin_raw`, 17 AS `radical_id`
    UNION ALL
    SELECT '出来' AS `hanzi`, 'chulai' AS `pinyin_raw`, 17 AS `radical_id`
    UNION ALL
    SELECT '出来' AS `hanzi`, 'chulai' AS `pinyin_raw`, 75 AS `radical_id`
    UNION ALL
    SELECT '出去' AS `hanzi`, 'chuqu' AS `pinyin_raw`, 17 AS `radical_id`
    UNION ALL
    SELECT '出去' AS `hanzi`, 'chuqu' AS `pinyin_raw`, 28 AS `radical_id`
    UNION ALL
    SELECT '穿' AS `hanzi`, 'chuan' AS `pinyin_raw`, 116 AS `radical_id`
    UNION ALL
    SELECT '床' AS `hanzi`, 'chuang' AS `pinyin_raw`, 53 AS `radical_id`
    UNION ALL
    SELECT '次' AS `hanzi`, 'ci' AS `pinyin_raw`, 76 AS `radical_id`
    UNION ALL
    SELECT '从' AS `hanzi`, 'cong' AS `pinyin_raw`, 9 AS `radical_id`
    UNION ALL
    SELECT '错' AS `hanzi`, 'cuo' AS `pinyin_raw`, 167 AS `radical_id`
    UNION ALL
    SELECT '打' AS `hanzi`, 'da' AS `pinyin_raw`, 64 AS `radical_id`
    UNION ALL
    SELECT '打车' AS `hanzi`, 'dache' AS `pinyin_raw`, 64 AS `radical_id`
    UNION ALL
    SELECT '打车' AS `hanzi`, 'dache' AS `pinyin_raw`, 159 AS `radical_id`
    UNION ALL
    SELECT '打电话' AS `hanzi`, 'da dianhua' AS `pinyin_raw`, 64 AS `radical_id`
    UNION ALL
    SELECT '打电话' AS `hanzi`, 'da dianhua' AS `pinyin_raw`, 102 AS `radical_id`
    UNION ALL
    SELECT '打电话' AS `hanzi`, 'da dianhua' AS `pinyin_raw`, 149 AS `radical_id`
    UNION ALL
    SELECT '打开' AS `hanzi`, 'dakai' AS `pinyin_raw`, 55 AS `radical_id`
    UNION ALL
    SELECT '打开' AS `hanzi`, 'dakai' AS `pinyin_raw`, 64 AS `radical_id`
    UNION ALL
    SELECT '打球' AS `hanzi`, 'da qiu' AS `pinyin_raw`, 64 AS `radical_id`
    UNION ALL
    SELECT '打球' AS `hanzi`, 'da qiu' AS `pinyin_raw`, 96 AS `radical_id`
    UNION ALL
    SELECT '大' AS `hanzi`, 'da' AS `pinyin_raw`, 37 AS `radical_id`
    UNION ALL
    SELECT '大学' AS `hanzi`, 'daxue' AS `pinyin_raw`, 37 AS `radical_id`
    UNION ALL
    SELECT '大学' AS `hanzi`, 'daxue' AS `pinyin_raw`, 39 AS `radical_id`
    UNION ALL
    SELECT '大学生' AS `hanzi`, 'daxuesheng' AS `pinyin_raw`, 37 AS `radical_id`
    UNION ALL
    SELECT '大学生' AS `hanzi`, 'daxuesheng' AS `pinyin_raw`, 39 AS `radical_id`
    UNION ALL
    SELECT '大学生' AS `hanzi`, 'daxuesheng' AS `pinyin_raw`, 100 AS `radical_id`
    UNION ALL
    SELECT '到' AS `hanzi`, 'dao' AS `pinyin_raw`, 18 AS `radical_id`
    UNION ALL
    SELECT '得到' AS `hanzi`, 'dedao' AS `pinyin_raw`, 18 AS `radical_id`
    UNION ALL
    SELECT '得到' AS `hanzi`, 'dedao' AS `pinyin_raw`, 60 AS `radical_id`
    UNION ALL
    SELECT '地' AS `hanzi`, 'de' AS `pinyin_raw`, 32 AS `radical_id`
    UNION ALL
    SELECT '的' AS `hanzi`, 'de' AS `pinyin_raw`, 106 AS `radical_id`
    UNION ALL
    SELECT '等' AS `hanzi`, 'deng' AS `pinyin_raw`, 118 AS `radical_id`
    UNION ALL
    SELECT '地' AS `hanzi`, 'di' AS `pinyin_raw`, 32 AS `radical_id`
    UNION ALL
    SELECT '地点' AS `hanzi`, 'didian' AS `pinyin_raw`, 32 AS `radical_id`
    UNION ALL
    SELECT '地点' AS `hanzi`, 'didian' AS `pinyin_raw`, 86 AS `radical_id`
    UNION ALL
    SELECT '地方' AS `hanzi`, 'difang' AS `pinyin_raw`, 32 AS `radical_id`
    UNION ALL
    SELECT '地方' AS `hanzi`, 'difang' AS `pinyin_raw`, 70 AS `radical_id`
    UNION ALL
    SELECT '地上' AS `hanzi`, 'dishang' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '地上' AS `hanzi`, 'dishang' AS `pinyin_raw`, 32 AS `radical_id`
    UNION ALL
    SELECT '地图' AS `hanzi`, 'ditu' AS `pinyin_raw`, 31 AS `radical_id`
    UNION ALL
    SELECT '地图' AS `hanzi`, 'ditu' AS `pinyin_raw`, 32 AS `radical_id`
    UNION ALL
    SELECT '弟弟' AS `hanzi`, 'didi' AS `pinyin_raw`, 57 AS `radical_id`
    UNION ALL
    SELECT '第' AS `hanzi`, 'di (di-er)' AS `pinyin_raw`, 118 AS `radical_id`
    UNION ALL
    SELECT '点' AS `hanzi`, 'dian' AS `pinyin_raw`, 86 AS `radical_id`
    UNION ALL
    SELECT '电' AS `hanzi`, 'dian' AS `pinyin_raw`, 102 AS `radical_id`
    UNION ALL
    SELECT '电话' AS `hanzi`, 'dianhua' AS `pinyin_raw`, 102 AS `radical_id`
    UNION ALL
    SELECT '电话' AS `hanzi`, 'dianhua' AS `pinyin_raw`, 149 AS `radical_id`
    UNION ALL
    SELECT '电脑' AS `hanzi`, 'diannao' AS `pinyin_raw`, 102 AS `radical_id`
    UNION ALL
    SELECT '电脑' AS `hanzi`, 'diannao' AS `pinyin_raw`, 130 AS `radical_id`
    UNION ALL
    SELECT '电视' AS `hanzi`, 'dianshi' AS `pinyin_raw`, 102 AS `radical_id`
    UNION ALL
    SELECT '电视' AS `hanzi`, 'dianshi' AS `pinyin_raw`, 113 AS `radical_id`
    UNION ALL
    SELECT '电视机' AS `hanzi`, 'dianshiji' AS `pinyin_raw`, 75 AS `radical_id`
    UNION ALL
    SELECT '电视机' AS `hanzi`, 'dianshiji' AS `pinyin_raw`, 102 AS `radical_id`
    UNION ALL
    SELECT '电视机' AS `hanzi`, 'dianshiji' AS `pinyin_raw`, 113 AS `radical_id`
    UNION ALL
    SELECT '电影' AS `hanzi`, 'dianying' AS `pinyin_raw`, 59 AS `radical_id`
    UNION ALL
    SELECT '电影' AS `hanzi`, 'dianying' AS `pinyin_raw`, 102 AS `radical_id`
    UNION ALL
    SELECT '电影院' AS `hanzi`, 'dianyingyuan' AS `pinyin_raw`, 59 AS `radical_id`
    UNION ALL
    SELECT '电影院' AS `hanzi`, 'dianyingyuan' AS `pinyin_raw`, 102 AS `radical_id`
    UNION ALL
    SELECT '电影院' AS `hanzi`, 'dianyingyuan' AS `pinyin_raw`, 170 AS `radical_id`
    UNION ALL
    SELECT '东' AS `hanzi`, 'dong' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '东边' AS `hanzi`, 'dongbian' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '东边' AS `hanzi`, 'dongbian' AS `pinyin_raw`, 162 AS `radical_id`
    UNION ALL
    SELECT '东西' AS `hanzi`, 'dongxi' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '东西' AS `hanzi`, 'dongxi' AS `pinyin_raw`, 146 AS `radical_id`
    UNION ALL
    SELECT '动' AS `hanzi`, 'dong' AS `pinyin_raw`, 19 AS `radical_id`
    UNION ALL
    SELECT '动作' AS `hanzi`, 'dongzuo' AS `pinyin_raw`, 9 AS `radical_id`
    UNION ALL
    SELECT '动作' AS `hanzi`, 'dongzuo' AS `pinyin_raw`, 19 AS `radical_id`
    UNION ALL
    SELECT '都' AS `hanzi`, 'dou' AS `pinyin_raw`, 163 AS `radical_id`
    UNION ALL
    SELECT '读' AS `hanzi`, 'du' AS `pinyin_raw`, 149 AS `radical_id`
    UNION ALL
    SELECT '读书' AS `hanzi`, 'dushu' AS `pinyin_raw`, 5 AS `radical_id`
    UNION ALL
    SELECT '读书' AS `hanzi`, 'dushu' AS `pinyin_raw`, 149 AS `radical_id`
    UNION ALL
    SELECT '对' AS `hanzi`, 'dui' AS `pinyin_raw`, 41 AS `radical_id`
    UNION ALL
    SELECT '对不起' AS `hanzi`, 'duibuqi' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '对不起' AS `hanzi`, 'duibuqi' AS `pinyin_raw`, 41 AS `radical_id`
    UNION ALL
    SELECT '对不起' AS `hanzi`, 'duibuqi' AS `pinyin_raw`, 156 AS `radical_id`
    UNION ALL
    SELECT '多' AS `hanzi`, 'duo' AS `pinyin_raw`, 36 AS `radical_id`
    UNION ALL
    SELECT '多少' AS `hanzi`, 'duoshao' AS `pinyin_raw`, 36 AS `radical_id`
    UNION ALL
    SELECT '多少' AS `hanzi`, 'duoshao' AS `pinyin_raw`, 42 AS `radical_id`
    UNION ALL
    SELECT '饿' AS `hanzi`, 'e' AS `pinyin_raw`, 184 AS `radical_id`
    UNION ALL
    SELECT '儿子' AS `hanzi`, 'erzi' AS `pinyin_raw`, 10 AS `radical_id`
    UNION ALL
    SELECT '儿子' AS `hanzi`, 'erzi' AS `pinyin_raw`, 39 AS `radical_id`
    UNION ALL
    SELECT '二' AS `hanzi`, 'er' AS `pinyin_raw`, 7 AS `radical_id`
    UNION ALL
    SELECT '饭' AS `hanzi`, 'fan' AS `pinyin_raw`, 184 AS `radical_id`
    UNION ALL
    SELECT '饭店' AS `hanzi`, 'fandian' AS `pinyin_raw`, 53 AS `radical_id`
    UNION ALL
    SELECT '饭店' AS `hanzi`, 'fandian' AS `pinyin_raw`, 184 AS `radical_id`
    UNION ALL
    SELECT '房间' AS `hanzi`, 'fangjian' AS `pinyin_raw`, 63 AS `radical_id`
    UNION ALL
    SELECT '房间' AS `hanzi`, 'fangjian' AS `pinyin_raw`, 169 AS `radical_id`
    UNION ALL
    SELECT '房子' AS `hanzi`, 'fangzi' AS `pinyin_raw`, 39 AS `radical_id`
    UNION ALL
    SELECT '房子' AS `hanzi`, 'fangzi' AS `pinyin_raw`, 63 AS `radical_id`
    UNION ALL
    SELECT '放' AS `hanzi`, 'fang' AS `pinyin_raw`, 66 AS `radical_id`
    UNION ALL
    SELECT '放假' AS `hanzi`, 'fangjia' AS `pinyin_raw`, 9 AS `radical_id`
    UNION ALL
    SELECT '放假' AS `hanzi`, 'fangjia' AS `pinyin_raw`, 66 AS `radical_id`
    UNION ALL
    SELECT '放学' AS `hanzi`, 'fangxue' AS `pinyin_raw`, 39 AS `radical_id`
    UNION ALL
    SELECT '放学' AS `hanzi`, 'fangxue' AS `pinyin_raw`, 66 AS `radical_id`
    UNION ALL
    SELECT '飞' AS `hanzi`, 'fei' AS `pinyin_raw`, 183 AS `radical_id`
    UNION ALL
    SELECT '飞机' AS `hanzi`, 'feiji' AS `pinyin_raw`, 75 AS `radical_id`
    UNION ALL
    SELECT '飞机' AS `hanzi`, 'feiji' AS `pinyin_raw`, 183 AS `radical_id`
    UNION ALL
    SELECT '非常' AS `hanzi`, 'feichang' AS `pinyin_raw`, 50 AS `radical_id`
    UNION ALL
    SELECT '非常' AS `hanzi`, 'feichang' AS `pinyin_raw`, 175 AS `radical_id`
    UNION ALL
    SELECT '分' AS `hanzi`, 'fen' AS `pinyin_raw`, 18 AS `radical_id`
    UNION ALL
    SELECT '风' AS `hanzi`, 'feng' AS `pinyin_raw`, 182 AS `radical_id`
    UNION ALL
    SELECT '干' AS `hanzi`, 'gan' AS `pinyin_raw`, 51 AS `radical_id`
    UNION ALL
    SELECT '干净' AS `hanzi`, 'ganjing' AS `pinyin_raw`, 15 AS `radical_id`
    UNION ALL
    SELECT '干净' AS `hanzi`, 'ganjing' AS `pinyin_raw`, 51 AS `radical_id`
    UNION ALL
    SELECT '干' AS `hanzi`, 'gan4' AS `pinyin_raw`, 51 AS `radical_id`
    UNION ALL
    SELECT '干什么' AS `hanzi`, 'gan shenme' AS `pinyin_raw`, 4 AS `radical_id`
    UNION ALL
    SELECT '干什么' AS `hanzi`, 'gan shenme' AS `pinyin_raw`, 9 AS `radical_id`
    UNION ALL
    SELECT '干什么' AS `hanzi`, 'gan shenme' AS `pinyin_raw`, 51 AS `radical_id`
    UNION ALL
    SELECT '高' AS `hanzi`, 'gao' AS `pinyin_raw`, 189 AS `radical_id`
    UNION ALL
    SELECT '高兴' AS `hanzi`, 'gaoxing' AS `pinyin_raw`, 12 AS `radical_id`
    UNION ALL
    SELECT '高兴' AS `hanzi`, 'gaoxing' AS `pinyin_raw`, 189 AS `radical_id`
    UNION ALL
    SELECT '告诉' AS `hanzi`, 'gaosu' AS `pinyin_raw`, 30 AS `radical_id`
    UNION ALL
    SELECT '告诉' AS `hanzi`, 'gaosu' AS `pinyin_raw`, 149 AS `radical_id`
    UNION ALL
    SELECT '哥哥' AS `hanzi`, 'gege' AS `pinyin_raw`, 30 AS `radical_id`
    UNION ALL
    SELECT '歌' AS `hanzi`, 'ge' AS `pinyin_raw`, 76 AS `radical_id`
    UNION ALL
    SELECT '个' AS `hanzi`, 'ge' AS `pinyin_raw`, 2 AS `radical_id`
    UNION ALL
    SELECT '给' AS `hanzi`, 'gei' AS `pinyin_raw`, 120 AS `radical_id`
    UNION ALL
    SELECT '跟' AS `hanzi`, 'gen' AS `pinyin_raw`, 157 AS `radical_id`
    UNION ALL
    SELECT '工人' AS `hanzi`, 'gongren' AS `pinyin_raw`, 9 AS `radical_id`
    UNION ALL
    SELECT '工人' AS `hanzi`, 'gongren' AS `pinyin_raw`, 48 AS `radical_id`
    UNION ALL
    SELECT '工作' AS `hanzi`, 'gongzuo' AS `pinyin_raw`, 9 AS `radical_id`
    UNION ALL
    SELECT '工作' AS `hanzi`, 'gongzuo' AS `pinyin_raw`, 48 AS `radical_id`
    UNION ALL
    SELECT '关' AS `hanzi`, 'guan' AS `pinyin_raw`, 12 AS `radical_id`
    UNION ALL
    SELECT '关上' AS `hanzi`, 'guanshang' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '关上' AS `hanzi`, 'guanshang' AS `pinyin_raw`, 12 AS `radical_id`
    UNION ALL
    SELECT '贵' AS `hanzi`, 'gui' AS `pinyin_raw`, 154 AS `radical_id`
    UNION ALL
    SELECT '国' AS `hanzi`, 'guo' AS `pinyin_raw`, 31 AS `radical_id`
    UNION ALL
    SELECT '国家' AS `hanzi`, 'guojia' AS `pinyin_raw`, 31 AS `radical_id`
    UNION ALL
    SELECT '国家' AS `hanzi`, 'guojia' AS `pinyin_raw`, 40 AS `radical_id`
    UNION ALL
    SELECT '国外' AS `hanzi`, 'guo wai' AS `pinyin_raw`, 31 AS `radical_id`
    UNION ALL
    SELECT '国外' AS `hanzi`, 'guo wai' AS `pinyin_raw`, 36 AS `radical_id`
    UNION ALL
    SELECT '过' AS `hanzi`, 'guo' AS `pinyin_raw`, 162 AS `radical_id`
    UNION ALL
    SELECT '还' AS `hanzi`, 'hai' AS `pinyin_raw`, 162 AS `radical_id`
    UNION ALL
    SELECT '还是' AS `hanzi`, 'haishi' AS `pinyin_raw`, 72 AS `radical_id`
    UNION ALL
    SELECT '还是' AS `hanzi`, 'haishi' AS `pinyin_raw`, 162 AS `radical_id`
    UNION ALL
    SELECT '还有' AS `hanzi`, 'hai you' AS `pinyin_raw`, 74 AS `radical_id`
    UNION ALL
    SELECT '还有' AS `hanzi`, 'hai you' AS `pinyin_raw`, 162 AS `radical_id`
    UNION ALL
    SELECT '孩子' AS `hanzi`, 'haizi' AS `pinyin_raw`, 39 AS `radical_id`
    UNION ALL
    SELECT '汉语' AS `hanzi`, 'hanyu' AS `pinyin_raw`, 85 AS `radical_id`
    UNION ALL
    SELECT '汉语' AS `hanzi`, 'hanyu' AS `pinyin_raw`, 149 AS `radical_id`
    UNION ALL
    SELECT '汉字' AS `hanzi`, 'hanzi' AS `pinyin_raw`, 39 AS `radical_id`
    UNION ALL
    SELECT '汉字' AS `hanzi`, 'hanzi' AS `pinyin_raw`, 85 AS `radical_id`
    UNION ALL
    SELECT '好' AS `hanzi`, 'hao' AS `pinyin_raw`, 38 AS `radical_id`
    UNION ALL
    SELECT '好吃' AS `hanzi`, 'haochi' AS `pinyin_raw`, 30 AS `radical_id`
    UNION ALL
    SELECT '好吃' AS `hanzi`, 'haochi' AS `pinyin_raw`, 38 AS `radical_id`
    UNION ALL
    SELECT '好看' AS `hanzi`, 'haokan' AS `pinyin_raw`, 38 AS `radical_id`
    UNION ALL
    SELECT '好看' AS `hanzi`, 'haokan' AS `pinyin_raw`, 109 AS `radical_id`
    UNION ALL
    SELECT '好听' AS `hanzi`, 'haoting' AS `pinyin_raw`, 30 AS `radical_id`
    UNION ALL
    SELECT '好听' AS `hanzi`, 'haoting' AS `pinyin_raw`, 38 AS `radical_id`
    UNION ALL
    SELECT '好玩儿' AS `hanzi`, 'haowanr' AS `pinyin_raw`, 10 AS `radical_id`
    UNION ALL
    SELECT '好玩儿' AS `hanzi`, 'haowanr' AS `pinyin_raw`, 38 AS `radical_id`
    UNION ALL
    SELECT '好玩儿' AS `hanzi`, 'haowanr' AS `pinyin_raw`, 96 AS `radical_id`
    UNION ALL
    SELECT '号' AS `hanzi`, 'hao' AS `pinyin_raw`, 30 AS `radical_id`
    UNION ALL
    SELECT '喝' AS `hanzi`, 'he' AS `pinyin_raw`, 30 AS `radical_id`
    UNION ALL
    SELECT '和' AS `hanzi`, 'he' AS `pinyin_raw`, 30 AS `radical_id`
    UNION ALL
    SELECT '很' AS `hanzi`, 'hen' AS `pinyin_raw`, 60 AS `radical_id`
    UNION ALL
    SELECT '后' AS `hanzi`, 'hou' AS `pinyin_raw`, 30 AS `radical_id`
    UNION ALL
    SELECT '后边' AS `hanzi`, 'houbian' AS `pinyin_raw`, 30 AS `radical_id`
    UNION ALL
    SELECT '后边' AS `hanzi`, 'houbian' AS `pinyin_raw`, 162 AS `radical_id`
    UNION ALL
    SELECT '后天' AS `hanzi`, 'houtian' AS `pinyin_raw`, 30 AS `radical_id`
    UNION ALL
    SELECT '后天' AS `hanzi`, 'houtian' AS `pinyin_raw`, 37 AS `radical_id`
    UNION ALL
    SELECT '花' AS `hanzi`, 'hua' AS `pinyin_raw`, 140 AS `radical_id`
    UNION ALL
    SELECT '话' AS `hanzi`, 'hua' AS `pinyin_raw`, 149 AS `radical_id`
    UNION ALL
    SELECT '坏' AS `hanzi`, 'huai' AS `pinyin_raw`, 32 AS `radical_id`
    UNION ALL
    SELECT '还' AS `hanzi`, 'huan' AS `pinyin_raw`, 162 AS `radical_id`
    UNION ALL
    SELECT '回' AS `hanzi`, 'hui' AS `pinyin_raw`, 31 AS `radical_id`
    UNION ALL
    SELECT '回答' AS `hanzi`, 'huida' AS `pinyin_raw`, 31 AS `radical_id`
    UNION ALL
    SELECT '回答' AS `hanzi`, 'huida' AS `pinyin_raw`, 118 AS `radical_id`
    UNION ALL
    SELECT '回到' AS `hanzi`, 'huidao' AS `pinyin_raw`, 18 AS `radical_id`
    UNION ALL
    SELECT '回到' AS `hanzi`, 'huidao' AS `pinyin_raw`, 31 AS `radical_id`
    UNION ALL
    SELECT '回家' AS `hanzi`, 'hui jia' AS `pinyin_raw`, 31 AS `radical_id`
    UNION ALL
    SELECT '回家' AS `hanzi`, 'hui jia' AS `pinyin_raw`, 40 AS `radical_id`
    UNION ALL
    SELECT '回来' AS `hanzi`, 'huilai' AS `pinyin_raw`, 31 AS `radical_id`
    UNION ALL
    SELECT '回来' AS `hanzi`, 'huilai' AS `pinyin_raw`, 75 AS `radical_id`
    UNION ALL
    SELECT '回去' AS `hanzi`, 'huiqu' AS `pinyin_raw`, 28 AS `radical_id`
    UNION ALL
    SELECT '回去' AS `hanzi`, 'huiqu' AS `pinyin_raw`, 31 AS `radical_id`
    UNION ALL
    SELECT '会' AS `hanzi`, 'hui' AS `pinyin_raw`, 9 AS `radical_id`
    UNION ALL
    SELECT '火车' AS `hanzi`, 'huoche' AS `pinyin_raw`, 86 AS `radical_id`
    UNION ALL
    SELECT '火车' AS `hanzi`, 'huoche' AS `pinyin_raw`, 159 AS `radical_id`
    UNION ALL
    SELECT '机场' AS `hanzi`, 'jichang' AS `pinyin_raw`, 32 AS `radical_id`
    UNION ALL
    SELECT '机场' AS `hanzi`, 'jichang' AS `pinyin_raw`, 75 AS `radical_id`
    UNION ALL
    SELECT '机票' AS `hanzi`, 'jipiao' AS `pinyin_raw`, 75 AS `radical_id`
    UNION ALL
    SELECT '机票' AS `hanzi`, 'jipiao' AS `pinyin_raw`, 113 AS `radical_id`
    UNION ALL
    SELECT '鸡蛋' AS `hanzi`, 'jidan' AS `pinyin_raw`, 142 AS `radical_id`
    UNION ALL
    SELECT '鸡蛋' AS `hanzi`, 'jidan' AS `pinyin_raw`, 196 AS `radical_id`
    UNION ALL
    SELECT '几' AS `hanzi`, 'ji' AS `pinyin_raw`, 16 AS `radical_id`
    UNION ALL
    SELECT '记' AS `hanzi`, 'ji' AS `pinyin_raw`, 149 AS `radical_id`
    UNION ALL
    SELECT '记得' AS `hanzi`, 'jide' AS `pinyin_raw`, 60 AS `radical_id`
    UNION ALL
    SELECT '记得' AS `hanzi`, 'jide' AS `pinyin_raw`, 149 AS `radical_id`
    UNION ALL
    SELECT '记住' AS `hanzi`, 'jizhu' AS `pinyin_raw`, 9 AS `radical_id`
    UNION ALL
    SELECT '记住' AS `hanzi`, 'jizhu' AS `pinyin_raw`, 149 AS `radical_id`
    UNION ALL
    SELECT '家' AS `hanzi`, 'jia' AS `pinyin_raw`, 40 AS `radical_id`
    UNION ALL
    SELECT '家里' AS `hanzi`, 'jia li' AS `pinyin_raw`, 40 AS `radical_id`
    UNION ALL
    SELECT '家里' AS `hanzi`, 'jia li' AS `pinyin_raw`, 166 AS `radical_id`
    UNION ALL
    SELECT '家人' AS `hanzi`, 'jiaren' AS `pinyin_raw`, 9 AS `radical_id`
    UNION ALL
    SELECT '家人' AS `hanzi`, 'jiaren' AS `pinyin_raw`, 40 AS `radical_id`
    UNION ALL
    SELECT '间' AS `hanzi`, 'jian' AS `pinyin_raw`, 169 AS `radical_id`
    UNION ALL
    SELECT '见' AS `hanzi`, 'jian' AS `pinyin_raw`, 147 AS `radical_id`
    UNION ALL
    SELECT '见面' AS `hanzi`, 'jianmian' AS `pinyin_raw`, 147 AS `radical_id`
    UNION ALL
    SELECT '见面' AS `hanzi`, 'jianmian' AS `pinyin_raw`, 176 AS `radical_id`
    UNION ALL
    SELECT '教' AS `hanzi`, 'jiao' AS `pinyin_raw`, 66 AS `radical_id`
    UNION ALL
    SELECT '叫' AS `hanzi`, 'jiao' AS `pinyin_raw`, 30 AS `radical_id`
    UNION ALL
    SELECT '教学楼' AS `hanzi`, 'jiaoxuelou' AS `pinyin_raw`, 39 AS `radical_id`
    UNION ALL
    SELECT '教学楼' AS `hanzi`, 'jiaoxuelou' AS `pinyin_raw`, 66 AS `radical_id`
    UNION ALL
    SELECT '教学楼' AS `hanzi`, 'jiaoxuelou' AS `pinyin_raw`, 75 AS `radical_id`
    UNION ALL
    SELECT '姐姐' AS `hanzi`, 'jiejie' AS `pinyin_raw`, 38 AS `radical_id`
    UNION ALL
    SELECT '介绍' AS `hanzi`, 'jieshao' AS `pinyin_raw`, 9 AS `radical_id`
    UNION ALL
    SELECT '介绍' AS `hanzi`, 'jieshao' AS `pinyin_raw`, 120 AS `radical_id`
    UNION ALL
    SELECT '今年' AS `hanzi`, 'jinnian' AS `pinyin_raw`, 9 AS `radical_id`
    UNION ALL
    SELECT '今年' AS `hanzi`, 'jinnian' AS `pinyin_raw`, 51 AS `radical_id`
    UNION ALL
    SELECT '今天' AS `hanzi`, 'jintian' AS `pinyin_raw`, 9 AS `radical_id`
    UNION ALL
    SELECT '今天' AS `hanzi`, 'jintian' AS `pinyin_raw`, 37 AS `radical_id`
    UNION ALL
    SELECT '进' AS `hanzi`, 'jin' AS `pinyin_raw`, 162 AS `radical_id`
    UNION ALL
    SELECT '进来' AS `hanzi`, 'jinlai' AS `pinyin_raw`, 75 AS `radical_id`
    UNION ALL
    SELECT '进来' AS `hanzi`, 'jinlai' AS `pinyin_raw`, 162 AS `radical_id`
    UNION ALL
    SELECT '进去' AS `hanzi`, 'jinqu' AS `pinyin_raw`, 28 AS `radical_id`
    UNION ALL
    SELECT '进去' AS `hanzi`, 'jinqu' AS `pinyin_raw`, 162 AS `radical_id`
    UNION ALL
    SELECT '九' AS `hanzi`, 'jiu' AS `pinyin_raw`, 5 AS `radical_id`
    UNION ALL
    SELECT '就' AS `hanzi`, 'jiu' AS `pinyin_raw`, 43 AS `radical_id`
    UNION ALL
    SELECT '觉得' AS `hanzi`, 'juede' AS `pinyin_raw`, 60 AS `radical_id`
    UNION ALL
    SELECT '觉得' AS `hanzi`, 'juede' AS `pinyin_raw`, 147 AS `radical_id`
    UNION ALL
    SELECT '开' AS `hanzi`, 'kai' AS `pinyin_raw`, 55 AS `radical_id`
    UNION ALL
    SELECT '开车' AS `hanzi`, 'kaiche' AS `pinyin_raw`, 55 AS `radical_id`
    UNION ALL
    SELECT '开车' AS `hanzi`, 'kaiche' AS `pinyin_raw`, 159 AS `radical_id`
    UNION ALL
    SELECT '开会' AS `hanzi`, 'kaihui' AS `pinyin_raw`, 9 AS `radical_id`
    UNION ALL
    SELECT '开会' AS `hanzi`, 'kaihui' AS `pinyin_raw`, 55 AS `radical_id`
    UNION ALL
    SELECT '开玩笑' AS `hanzi`, 'kai wanxiao' AS `pinyin_raw`, 55 AS `radical_id`
    UNION ALL
    SELECT '开玩笑' AS `hanzi`, 'kai wanxiao' AS `pinyin_raw`, 96 AS `radical_id`
    UNION ALL
    SELECT '开玩笑' AS `hanzi`, 'kai wanxiao' AS `pinyin_raw`, 118 AS `radical_id`
    UNION ALL
    SELECT '看' AS `hanzi`, 'kan' AS `pinyin_raw`, 109 AS `radical_id`
    UNION ALL
    SELECT '看病' AS `hanzi`, 'kanbing' AS `pinyin_raw`, 104 AS `radical_id`
    UNION ALL
    SELECT '看病' AS `hanzi`, 'kanbing' AS `pinyin_raw`, 109 AS `radical_id`
    UNION ALL
    SELECT '看到' AS `hanzi`, 'kandao' AS `pinyin_raw`, 18 AS `radical_id`
    UNION ALL
    SELECT '看到' AS `hanzi`, 'kandao' AS `pinyin_raw`, 109 AS `radical_id`
    UNION ALL
    SELECT '看见' AS `hanzi`, 'kanjian' AS `pinyin_raw`, 109 AS `radical_id`
    UNION ALL
    SELECT '看见' AS `hanzi`, 'kanjian' AS `pinyin_raw`, 147 AS `radical_id`
    UNION ALL
    SELECT '考' AS `hanzi`, 'kao' AS `pinyin_raw`, 125 AS `radical_id`
    UNION ALL
    SELECT '考试' AS `hanzi`, 'kaoshi' AS `pinyin_raw`, 125 AS `radical_id`
    UNION ALL
    SELECT '考试' AS `hanzi`, 'kaoshi' AS `pinyin_raw`, 149 AS `radical_id`
    UNION ALL
    SELECT '渴' AS `hanzi`, 'ke' AS `pinyin_raw`, 85 AS `radical_id`
    UNION ALL
    SELECT '课' AS `hanzi`, 'ke' AS `pinyin_raw`, 149 AS `radical_id`
    UNION ALL
    SELECT '课本' AS `hanzi`, 'keben' AS `pinyin_raw`, 75 AS `radical_id`
    UNION ALL
    SELECT '课本' AS `hanzi`, 'keben' AS `pinyin_raw`, 149 AS `radical_id`
    UNION ALL
    SELECT '课文' AS `hanzi`, 'kewen' AS `pinyin_raw`, 67 AS `radical_id`
    UNION ALL
    SELECT '课文' AS `hanzi`, 'kewen' AS `pinyin_raw`, 149 AS `radical_id`
    UNION ALL
    SELECT '口' AS `hanzi`, 'kou' AS `pinyin_raw`, 30 AS `radical_id`
    UNION ALL
    SELECT '块' AS `hanzi`, 'kuai' AS `pinyin_raw`, 32 AS `radical_id`
    UNION ALL
    SELECT '快' AS `hanzi`, 'kuai' AS `pinyin_raw`, 61 AS `radical_id`
    UNION ALL
    SELECT '来' AS `hanzi`, 'lai' AS `pinyin_raw`, 75 AS `radical_id`
    UNION ALL
    SELECT '来到' AS `hanzi`, 'laidao' AS `pinyin_raw`, 18 AS `radical_id`
    UNION ALL
    SELECT '来到' AS `hanzi`, 'laidao' AS `pinyin_raw`, 75 AS `radical_id`
    UNION ALL
    SELECT '老' AS `hanzi`, 'lao' AS `pinyin_raw`, 125 AS `radical_id`
    UNION ALL
    SELECT '老人' AS `hanzi`, 'laoren' AS `pinyin_raw`, 9 AS `radical_id`
    UNION ALL
    SELECT '老人' AS `hanzi`, 'laoren' AS `pinyin_raw`, 125 AS `radical_id`
    UNION ALL
    SELECT '老师' AS `hanzi`, 'laoshi' AS `pinyin_raw`, 50 AS `radical_id`
    UNION ALL
    SELECT '老师' AS `hanzi`, 'laoshi' AS `pinyin_raw`, 125 AS `radical_id`
    UNION ALL
    SELECT '了' AS `hanzi`, 'le' AS `pinyin_raw`, 6 AS `radical_id`
    UNION ALL
    SELECT '累' AS `hanzi`, 'lei' AS `pinyin_raw`, 120 AS `radical_id`
    UNION ALL
    SELECT '冷' AS `hanzi`, 'leng' AS `pinyin_raw`, 15 AS `radical_id`
    UNION ALL
    SELECT '里' AS `hanzi`, 'li' AS `pinyin_raw`, 166 AS `radical_id`
    UNION ALL
    SELECT '里边' AS `hanzi`, 'libian' AS `pinyin_raw`, 162 AS `radical_id`
    UNION ALL
    SELECT '里边' AS `hanzi`, 'libian' AS `pinyin_raw`, 166 AS `radical_id`
    UNION ALL
    SELECT '两' AS `hanzi`, 'liang' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '零' AS `hanzi`, 'ling' AS `pinyin_raw`, 173 AS `radical_id`
    UNION ALL
    SELECT '六' AS `hanzi`, 'liu' AS `pinyin_raw`, 12 AS `radical_id`
    UNION ALL
    SELECT '楼' AS `hanzi`, 'lou' AS `pinyin_raw`, 75 AS `radical_id`
    UNION ALL
    SELECT '楼上' AS `hanzi`, 'lou shang' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '楼上' AS `hanzi`, 'lou shang' AS `pinyin_raw`, 75 AS `radical_id`
    UNION ALL
    SELECT '楼下' AS `hanzi`, 'lou xia' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '楼下' AS `hanzi`, 'lou xia' AS `pinyin_raw`, 75 AS `radical_id`
    UNION ALL
    SELECT '路' AS `hanzi`, 'lu' AS `pinyin_raw`, 157 AS `radical_id`
    UNION ALL
    SELECT '路口' AS `hanzi`, 'lukou' AS `pinyin_raw`, 30 AS `radical_id`
    UNION ALL
    SELECT '路口' AS `hanzi`, 'lukou' AS `pinyin_raw`, 157 AS `radical_id`
    UNION ALL
    SELECT '路上' AS `hanzi`, 'lushang' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '路上' AS `hanzi`, 'lushang' AS `pinyin_raw`, 157 AS `radical_id`
    UNION ALL
    SELECT '妈妈' AS `hanzi`, 'mama' AS `pinyin_raw`, 38 AS `radical_id`
    UNION ALL
    SELECT '马路' AS `hanzi`, 'malu' AS `pinyin_raw`, 157 AS `radical_id`
    UNION ALL
    SELECT '马路' AS `hanzi`, 'malu' AS `pinyin_raw`, 187 AS `radical_id`
    UNION ALL
    SELECT '马上' AS `hanzi`, 'mashang' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '马上' AS `hanzi`, 'mashang' AS `pinyin_raw`, 187 AS `radical_id`
    UNION ALL
    SELECT '吗' AS `hanzi`, 'ma' AS `pinyin_raw`, 30 AS `radical_id`
    UNION ALL
    SELECT '买' AS `hanzi`, 'mai' AS `pinyin_raw`, 5 AS `radical_id`
    UNION ALL
    SELECT '慢' AS `hanzi`, 'man' AS `pinyin_raw`, 61 AS `radical_id`
    UNION ALL
    SELECT '忙' AS `hanzi`, 'mang' AS `pinyin_raw`, 61 AS `radical_id`
    UNION ALL
    SELECT '毛' AS `hanzi`, 'mao' AS `pinyin_raw`, 82 AS `radical_id`
    UNION ALL
    SELECT '没' AS `hanzi`, 'mei' AS `pinyin_raw`, 85 AS `radical_id`
    UNION ALL
    SELECT '没关系' AS `hanzi`, 'mei guanxi' AS `pinyin_raw`, 12 AS `radical_id`
    UNION ALL
    SELECT '没关系' AS `hanzi`, 'mei guanxi' AS `pinyin_raw`, 85 AS `radical_id`
    UNION ALL
    SELECT '没关系' AS `hanzi`, 'mei guanxi' AS `pinyin_raw`, 120 AS `radical_id`
    UNION ALL
    SELECT '没什么' AS `hanzi`, 'mei shenme' AS `pinyin_raw`, 4 AS `radical_id`
    UNION ALL
    SELECT '没什么' AS `hanzi`, 'mei shenme' AS `pinyin_raw`, 9 AS `radical_id`
    UNION ALL
    SELECT '没什么' AS `hanzi`, 'mei shenme' AS `pinyin_raw`, 85 AS `radical_id`
    UNION ALL
    SELECT '没事儿' AS `hanzi`, 'meishir' AS `pinyin_raw`, 6 AS `radical_id`
    UNION ALL
    SELECT '没事儿' AS `hanzi`, 'meishir' AS `pinyin_raw`, 10 AS `radical_id`
    UNION ALL
    SELECT '没事儿' AS `hanzi`, 'meishir' AS `pinyin_raw`, 85 AS `radical_id`
    UNION ALL
    SELECT '没有' AS `hanzi`, 'meiyou' AS `pinyin_raw`, 74 AS `radical_id`
    UNION ALL
    SELECT '没有' AS `hanzi`, 'meiyou' AS `pinyin_raw`, 85 AS `radical_id`
    UNION ALL
    SELECT '妹妹' AS `hanzi`, 'meimei' AS `pinyin_raw`, 38 AS `radical_id`
    UNION ALL
    SELECT '门' AS `hanzi`, 'men' AS `pinyin_raw`, 169 AS `radical_id`
    UNION ALL
    SELECT '门口' AS `hanzi`, 'menkou' AS `pinyin_raw`, 30 AS `radical_id`
    UNION ALL
    SELECT '门口' AS `hanzi`, 'menkou' AS `pinyin_raw`, 169 AS `radical_id`
    UNION ALL
    SELECT '门票' AS `hanzi`, 'menpiao' AS `pinyin_raw`, 113 AS `radical_id`
    UNION ALL
    SELECT '门票' AS `hanzi`, 'menpiao' AS `pinyin_raw`, 169 AS `radical_id`
    UNION ALL
    SELECT '们' AS `hanzi`, 'men (pengyoumen)' AS `pinyin_raw`, 9 AS `radical_id`
    UNION ALL
    SELECT '米饭' AS `hanzi`, 'mifan' AS `pinyin_raw`, 119 AS `radical_id`
    UNION ALL
    SELECT '米饭' AS `hanzi`, 'mifan' AS `pinyin_raw`, 184 AS `radical_id`
    UNION ALL
    SELECT '面包' AS `hanzi`, 'mianbao' AS `pinyin_raw`, 20 AS `radical_id`
    UNION ALL
    SELECT '面包' AS `hanzi`, 'mianbao' AS `pinyin_raw`, 176 AS `radical_id`
    UNION ALL
    SELECT '面条儿' AS `hanzi`, 'miantiaor' AS `pinyin_raw`, 10 AS `radical_id`
    UNION ALL
    SELECT '面条儿' AS `hanzi`, 'miantiaor' AS `pinyin_raw`, 75 AS `radical_id`
    UNION ALL
    SELECT '面条儿' AS `hanzi`, 'miantiaor' AS `pinyin_raw`, 176 AS `radical_id`
    UNION ALL
    SELECT '名字' AS `hanzi`, 'mingzi' AS `pinyin_raw`, 30 AS `radical_id`
    UNION ALL
    SELECT '名字' AS `hanzi`, 'mingzi' AS `pinyin_raw`, 39 AS `radical_id`
    UNION ALL
    SELECT '明白' AS `hanzi`, 'mingbai' AS `pinyin_raw`, 72 AS `radical_id`
    UNION ALL
    SELECT '明白' AS `hanzi`, 'mingbai' AS `pinyin_raw`, 106 AS `radical_id`
    UNION ALL
    SELECT '明年' AS `hanzi`, 'mingnian' AS `pinyin_raw`, 51 AS `radical_id`
    UNION ALL
    SELECT '明年' AS `hanzi`, 'mingnian' AS `pinyin_raw`, 72 AS `radical_id`
    UNION ALL
    SELECT '明天' AS `hanzi`, 'mingtian' AS `pinyin_raw`, 37 AS `radical_id`
    UNION ALL
    SELECT '明天' AS `hanzi`, 'mingtian' AS `pinyin_raw`, 72 AS `radical_id`
    UNION ALL
    SELECT '拿' AS `hanzi`, 'na' AS `pinyin_raw`, 64 AS `radical_id`
    UNION ALL
    SELECT '哪' AS `hanzi`, 'na' AS `pinyin_raw`, 30 AS `radical_id`
    UNION ALL
    SELECT '哪里' AS `hanzi`, 'nali' AS `pinyin_raw`, 30 AS `radical_id`
    UNION ALL
    SELECT '哪里' AS `hanzi`, 'nali' AS `pinyin_raw`, 166 AS `radical_id`
    UNION ALL
    SELECT '哪儿' AS `hanzi`, 'nar' AS `pinyin_raw`, 10 AS `radical_id`
    UNION ALL
    SELECT '哪儿' AS `hanzi`, 'nar' AS `pinyin_raw`, 30 AS `radical_id`
    UNION ALL
    SELECT '哪些' AS `hanzi`, 'naxie' AS `pinyin_raw`, 7 AS `radical_id`
    UNION ALL
    SELECT '哪些' AS `hanzi`, 'naxie' AS `pinyin_raw`, 30 AS `radical_id`
    UNION ALL
    SELECT '那' AS `hanzi`, 'na' AS `pinyin_raw`, 163 AS `radical_id`
    UNION ALL
    SELECT '那边' AS `hanzi`, 'nabian' AS `pinyin_raw`, 162 AS `radical_id`
    UNION ALL
    SELECT '那边' AS `hanzi`, 'nabian' AS `pinyin_raw`, 163 AS `radical_id`
    UNION ALL
    SELECT '那里' AS `hanzi`, 'nali' AS `pinyin_raw`, 163 AS `radical_id`
    UNION ALL
    SELECT '那里' AS `hanzi`, 'nali' AS `pinyin_raw`, 166 AS `radical_id`
    UNION ALL
    SELECT '那儿' AS `hanzi`, 'nar' AS `pinyin_raw`, 10 AS `radical_id`
    UNION ALL
    SELECT '那儿' AS `hanzi`, 'nar' AS `pinyin_raw`, 163 AS `radical_id`
    UNION ALL
    SELECT '那些' AS `hanzi`, 'naxie' AS `pinyin_raw`, 7 AS `radical_id`
    UNION ALL
    SELECT '那些' AS `hanzi`, 'naxie' AS `pinyin_raw`, 163 AS `radical_id`
    UNION ALL
    SELECT '奶' AS `hanzi`, 'nai' AS `pinyin_raw`, 38 AS `radical_id`
    UNION ALL
    SELECT '奶奶' AS `hanzi`, 'nainai' AS `pinyin_raw`, 38 AS `radical_id`
    UNION ALL
    SELECT '男' AS `hanzi`, 'nan' AS `pinyin_raw`, 102 AS `radical_id`
    UNION ALL
    SELECT '男孩儿' AS `hanzi`, 'nanhair' AS `pinyin_raw`, 10 AS `radical_id`
    UNION ALL
    SELECT '男孩儿' AS `hanzi`, 'nanhair' AS `pinyin_raw`, 39 AS `radical_id`
    UNION ALL
    SELECT '男孩儿' AS `hanzi`, 'nanhair' AS `pinyin_raw`, 102 AS `radical_id`
    UNION ALL
    SELECT '男朋友' AS `hanzi`, 'nanpengyou' AS `pinyin_raw`, 29 AS `radical_id`
    UNION ALL
    SELECT '男朋友' AS `hanzi`, 'nanpengyou' AS `pinyin_raw`, 74 AS `radical_id`
    UNION ALL
    SELECT '男朋友' AS `hanzi`, 'nanpengyou' AS `pinyin_raw`, 102 AS `radical_id`
    UNION ALL
    SELECT '男人' AS `hanzi`, 'nanren' AS `pinyin_raw`, 9 AS `radical_id`
    UNION ALL
    SELECT '男人' AS `hanzi`, 'nanren' AS `pinyin_raw`, 102 AS `radical_id`
    UNION ALL
    SELECT '男生' AS `hanzi`, 'nansheng' AS `pinyin_raw`, 100 AS `radical_id`
    UNION ALL
    SELECT '男生' AS `hanzi`, 'nansheng' AS `pinyin_raw`, 102 AS `radical_id`
    UNION ALL
    SELECT '南' AS `hanzi`, 'nan' AS `pinyin_raw`, 24 AS `radical_id`
    UNION ALL
    SELECT '南边' AS `hanzi`, 'nanbian' AS `pinyin_raw`, 24 AS `radical_id`
    UNION ALL
    SELECT '南边' AS `hanzi`, 'nanbian' AS `pinyin_raw`, 162 AS `radical_id`
    UNION ALL
    SELECT '难' AS `hanzi`, 'nan' AS `pinyin_raw`, 172 AS `radical_id`
    UNION ALL
    SELECT '呢' AS `hanzi`, 'ne' AS `pinyin_raw`, 30 AS `radical_id`
    UNION ALL
    SELECT '能' AS `hanzi`, 'neng' AS `pinyin_raw`, 130 AS `radical_id`
    UNION ALL
    SELECT '你' AS `hanzi`, 'ni' AS `pinyin_raw`, 9 AS `radical_id`
    UNION ALL
    SELECT '你们' AS `hanzi`, 'nimen' AS `pinyin_raw`, 9 AS `radical_id`
    UNION ALL
    SELECT '年' AS `hanzi`, 'nian' AS `pinyin_raw`, 51 AS `radical_id`
    UNION ALL
    SELECT '您' AS `hanzi`, 'nin' AS `pinyin_raw`, 61 AS `radical_id`
    UNION ALL
    SELECT '牛奶' AS `hanzi`, 'niunai' AS `pinyin_raw`, 38 AS `radical_id`
    UNION ALL
    SELECT '牛奶' AS `hanzi`, 'niunai' AS `pinyin_raw`, 93 AS `radical_id`
    UNION ALL
    SELECT '女' AS `hanzi`, 'nu' AS `pinyin_raw`, 38 AS `radical_id`
    UNION ALL
    SELECT '女儿' AS `hanzi`, 'nu''er' AS `pinyin_raw`, 10 AS `radical_id`
    UNION ALL
    SELECT '女儿' AS `hanzi`, 'nu''er' AS `pinyin_raw`, 38 AS `radical_id`
    UNION ALL
    SELECT '女孩儿' AS `hanzi`, 'nuhair' AS `pinyin_raw`, 10 AS `radical_id`
    UNION ALL
    SELECT '女孩儿' AS `hanzi`, 'nuhair' AS `pinyin_raw`, 38 AS `radical_id`
    UNION ALL
    SELECT '女孩儿' AS `hanzi`, 'nuhair' AS `pinyin_raw`, 39 AS `radical_id`
    UNION ALL
    SELECT '女朋友' AS `hanzi`, 'nupengyou' AS `pinyin_raw`, 29 AS `radical_id`
    UNION ALL
    SELECT '女朋友' AS `hanzi`, 'nupengyou' AS `pinyin_raw`, 38 AS `radical_id`
    UNION ALL
    SELECT '女朋友' AS `hanzi`, 'nupengyou' AS `pinyin_raw`, 74 AS `radical_id`
    UNION ALL
    SELECT '女人' AS `hanzi`, 'nuren' AS `pinyin_raw`, 9 AS `radical_id`
    UNION ALL
    SELECT '女人' AS `hanzi`, 'nuren' AS `pinyin_raw`, 38 AS `radical_id`
    UNION ALL
    SELECT '女生' AS `hanzi`, 'nusheng' AS `pinyin_raw`, 38 AS `radical_id`
    UNION ALL
    SELECT '女生' AS `hanzi`, 'nusheng' AS `pinyin_raw`, 100 AS `radical_id`
    UNION ALL
    SELECT '旁边' AS `hanzi`, 'pangbian' AS `pinyin_raw`, 70 AS `radical_id`
    UNION ALL
    SELECT '旁边' AS `hanzi`, 'pangbian' AS `pinyin_raw`, 162 AS `radical_id`
    UNION ALL
    SELECT '跑' AS `hanzi`, 'pao' AS `pinyin_raw`, 157 AS `radical_id`
    UNION ALL
    SELECT '朋友' AS `hanzi`, 'pengyou' AS `pinyin_raw`, 29 AS `radical_id`
    UNION ALL
    SELECT '朋友' AS `hanzi`, 'pengyou' AS `pinyin_raw`, 74 AS `radical_id`
    UNION ALL
    SELECT '票' AS `hanzi`, 'piao' AS `pinyin_raw`, 113 AS `radical_id`
    UNION ALL
    SELECT '七' AS `hanzi`, 'qi' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '起' AS `hanzi`, 'qi' AS `pinyin_raw`, 156 AS `radical_id`
    UNION ALL
    SELECT '起床' AS `hanzi`, 'qichuang' AS `pinyin_raw`, 53 AS `radical_id`
    UNION ALL
    SELECT '起床' AS `hanzi`, 'qichuang' AS `pinyin_raw`, 156 AS `radical_id`
    UNION ALL
    SELECT '起来' AS `hanzi`, 'qilai' AS `pinyin_raw`, 75 AS `radical_id`
    UNION ALL
    SELECT '起来' AS `hanzi`, 'qilai' AS `pinyin_raw`, 156 AS `radical_id`
    UNION ALL
    SELECT '汽车' AS `hanzi`, 'qiche' AS `pinyin_raw`, 85 AS `radical_id`
    UNION ALL
    SELECT '汽车' AS `hanzi`, 'qiche' AS `pinyin_raw`, 159 AS `radical_id`
    UNION ALL
    SELECT '前' AS `hanzi`, 'qian' AS `pinyin_raw`, 18 AS `radical_id`
    UNION ALL
    SELECT '前边' AS `hanzi`, 'qianbian' AS `pinyin_raw`, 18 AS `radical_id`
    UNION ALL
    SELECT '前边' AS `hanzi`, 'qianbian' AS `pinyin_raw`, 162 AS `radical_id`
    UNION ALL
    SELECT '前天' AS `hanzi`, 'qiantian' AS `pinyin_raw`, 18 AS `radical_id`
    UNION ALL
    SELECT '前天' AS `hanzi`, 'qiantian' AS `pinyin_raw`, 37 AS `radical_id`
    UNION ALL
    SELECT '钱' AS `hanzi`, 'qian' AS `pinyin_raw`, 167 AS `radical_id`
    UNION ALL
    SELECT '钱包' AS `hanzi`, 'qianbao' AS `pinyin_raw`, 20 AS `radical_id`
    UNION ALL
    SELECT '钱包' AS `hanzi`, 'qianbao' AS `pinyin_raw`, 167 AS `radical_id`
    UNION ALL
    SELECT '请' AS `hanzi`, 'qing' AS `pinyin_raw`, 149 AS `radical_id`
    UNION ALL
    SELECT '请假' AS `hanzi`, 'qingjia' AS `pinyin_raw`, 9 AS `radical_id`
    UNION ALL
    SELECT '请假' AS `hanzi`, 'qingjia' AS `pinyin_raw`, 149 AS `radical_id`
    UNION ALL
    SELECT '请进' AS `hanzi`, 'qing jin' AS `pinyin_raw`, 149 AS `radical_id`
    UNION ALL
    SELECT '请进' AS `hanzi`, 'qing jin' AS `pinyin_raw`, 162 AS `radical_id`
    UNION ALL
    SELECT '请问' AS `hanzi`, 'qingwen' AS `pinyin_raw`, 149 AS `radical_id`
    UNION ALL
    SELECT '请问' AS `hanzi`, 'qingwen' AS `pinyin_raw`, 169 AS `radical_id`
    UNION ALL
    SELECT '请坐' AS `hanzi`, 'qing zuo' AS `pinyin_raw`, 32 AS `radical_id`
    UNION ALL
    SELECT '请坐' AS `hanzi`, 'qing zuo' AS `pinyin_raw`, 149 AS `radical_id`
    UNION ALL
    SELECT '球' AS `hanzi`, 'qiu' AS `pinyin_raw`, 96 AS `radical_id`
    UNION ALL
    SELECT '去' AS `hanzi`, 'qu' AS `pinyin_raw`, 28 AS `radical_id`
    UNION ALL
    SELECT '去年' AS `hanzi`, 'qunian' AS `pinyin_raw`, 28 AS `radical_id`
    UNION ALL
    SELECT '去年' AS `hanzi`, 'qunian' AS `pinyin_raw`, 51 AS `radical_id`
    UNION ALL
    SELECT '热' AS `hanzi`, 're' AS `pinyin_raw`, 86 AS `radical_id`
    UNION ALL
    SELECT '人' AS `hanzi`, 'ren' AS `pinyin_raw`, 9 AS `radical_id`
    UNION ALL
    SELECT '认识' AS `hanzi`, 'renshi' AS `pinyin_raw`, 149 AS `radical_id`
    UNION ALL
    SELECT '认真' AS `hanzi`, 'renzhen' AS `pinyin_raw`, 109 AS `radical_id`
    UNION ALL
    SELECT '认真' AS `hanzi`, 'renzhen' AS `pinyin_raw`, 149 AS `radical_id`
    UNION ALL
    SELECT '日' AS `hanzi`, 'ri' AS `pinyin_raw`, 72 AS `radical_id`
    UNION ALL
    SELECT '日期' AS `hanzi`, 'riqi' AS `pinyin_raw`, 72 AS `radical_id`
    UNION ALL
    SELECT '日期' AS `hanzi`, 'riqi' AS `pinyin_raw`, 74 AS `radical_id`
    UNION ALL
    SELECT '肉' AS `hanzi`, 'rou' AS `pinyin_raw`, 130 AS `radical_id`
    UNION ALL
    SELECT '三' AS `hanzi`, 'san' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '山' AS `hanzi`, 'shan' AS `pinyin_raw`, 46 AS `radical_id`
    UNION ALL
    SELECT '商场' AS `hanzi`, 'shangchang' AS `pinyin_raw`, 30 AS `radical_id`
    UNION ALL
    SELECT '商场' AS `hanzi`, 'shangchang' AS `pinyin_raw`, 32 AS `radical_id`
    UNION ALL
    SELECT '商店' AS `hanzi`, 'shangdian' AS `pinyin_raw`, 30 AS `radical_id`
    UNION ALL
    SELECT '商店' AS `hanzi`, 'shangdian' AS `pinyin_raw`, 53 AS `radical_id`
    UNION ALL
    SELECT '上' AS `hanzi`, 'shang' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '上班' AS `hanzi`, 'shangban' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '上班' AS `hanzi`, 'shangban' AS `pinyin_raw`, 96 AS `radical_id`
    UNION ALL
    SELECT '上边' AS `hanzi`, 'shangbian' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '上边' AS `hanzi`, 'shangbian' AS `pinyin_raw`, 162 AS `radical_id`
    UNION ALL
    SELECT '上车' AS `hanzi`, 'shang che' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '上车' AS `hanzi`, 'shang che' AS `pinyin_raw`, 159 AS `radical_id`
    UNION ALL
    SELECT '上次' AS `hanzi`, 'shang ci' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '上次' AS `hanzi`, 'shang ci' AS `pinyin_raw`, 76 AS `radical_id`
    UNION ALL
    SELECT '上课' AS `hanzi`, 'shangke' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '上课' AS `hanzi`, 'shangke' AS `pinyin_raw`, 149 AS `radical_id`
    UNION ALL
    SELECT '上网' AS `hanzi`, 'shangwang' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '上网' AS `hanzi`, 'shangwang' AS `pinyin_raw`, 122 AS `radical_id`
    UNION ALL
    SELECT '上午' AS `hanzi`, 'shangwu' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '上午' AS `hanzi`, 'shangwu' AS `pinyin_raw`, 24 AS `radical_id`
    UNION ALL
    SELECT '上学' AS `hanzi`, 'shangxue' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '上学' AS `hanzi`, 'shangxue' AS `pinyin_raw`, 39 AS `radical_id`
    UNION ALL
    SELECT '少' AS `hanzi`, 'shao' AS `pinyin_raw`, 42 AS `radical_id`
    UNION ALL
    SELECT '谁' AS `hanzi`, 'shei/shui' AS `pinyin_raw`, 149 AS `radical_id`
    UNION ALL
    SELECT '身上' AS `hanzi`, 'shenshang' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '身上' AS `hanzi`, 'shenshang' AS `pinyin_raw`, 158 AS `radical_id`
    UNION ALL
    SELECT '身体' AS `hanzi`, 'shenti' AS `pinyin_raw`, 9 AS `radical_id`
    UNION ALL
    SELECT '身体' AS `hanzi`, 'shenti' AS `pinyin_raw`, 158 AS `radical_id`
    UNION ALL
    SELECT '什么' AS `hanzi`, 'shenme' AS `pinyin_raw`, 4 AS `radical_id`
    UNION ALL
    SELECT '什么' AS `hanzi`, 'shenme' AS `pinyin_raw`, 9 AS `radical_id`
    UNION ALL
    SELECT '生病' AS `hanzi`, 'shengbing' AS `pinyin_raw`, 100 AS `radical_id`
    UNION ALL
    SELECT '生病' AS `hanzi`, 'shengbing' AS `pinyin_raw`, 104 AS `radical_id`
    UNION ALL
    SELECT '生气' AS `hanzi`, 'shengqi' AS `pinyin_raw`, 84 AS `radical_id`
    UNION ALL
    SELECT '生气' AS `hanzi`, 'shengqi' AS `pinyin_raw`, 100 AS `radical_id`
    UNION ALL
    SELECT '生日' AS `hanzi`, 'shengri' AS `pinyin_raw`, 72 AS `radical_id`
    UNION ALL
    SELECT '生日' AS `hanzi`, 'shengri' AS `pinyin_raw`, 100 AS `radical_id`
    UNION ALL
    SELECT '十' AS `hanzi`, 'shi' AS `pinyin_raw`, 24 AS `radical_id`
    UNION ALL
    SELECT '时候' AS `hanzi`, 'shihou' AS `pinyin_raw`, 9 AS `radical_id`
    UNION ALL
    SELECT '时候' AS `hanzi`, 'shihou' AS `pinyin_raw`, 72 AS `radical_id`
    UNION ALL
    SELECT '时间' AS `hanzi`, 'shijian' AS `pinyin_raw`, 72 AS `radical_id`
    UNION ALL
    SELECT '时间' AS `hanzi`, 'shijian' AS `pinyin_raw`, 169 AS `radical_id`
    UNION ALL
    SELECT '事' AS `hanzi`, 'shi' AS `pinyin_raw`, 6 AS `radical_id`
    UNION ALL
    SELECT '试' AS `hanzi`, 'shi' AS `pinyin_raw`, 149 AS `radical_id`
    UNION ALL
    SELECT '是' AS `hanzi`, 'shi' AS `pinyin_raw`, 72 AS `radical_id`
    UNION ALL
    SELECT '是不是' AS `hanzi`, 'shi bu shi' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '是不是' AS `hanzi`, 'shi bu shi' AS `pinyin_raw`, 72 AS `radical_id`
    UNION ALL
    SELECT '手' AS `hanzi`, 'shou' AS `pinyin_raw`, 64 AS `radical_id`
    UNION ALL
    SELECT '手机' AS `hanzi`, 'shouji' AS `pinyin_raw`, 64 AS `radical_id`
    UNION ALL
    SELECT '手机' AS `hanzi`, 'shouji' AS `pinyin_raw`, 75 AS `radical_id`
    UNION ALL
    SELECT '书' AS `hanzi`, 'shu' AS `pinyin_raw`, 5 AS `radical_id`
    UNION ALL
    SELECT '书包' AS `hanzi`, 'shubao' AS `pinyin_raw`, 5 AS `radical_id`
    UNION ALL
    SELECT '书包' AS `hanzi`, 'shubao' AS `pinyin_raw`, 20 AS `radical_id`
    UNION ALL
    SELECT '书店' AS `hanzi`, 'shudian' AS `pinyin_raw`, 5 AS `radical_id`
    UNION ALL
    SELECT '书店' AS `hanzi`, 'shudian' AS `pinyin_raw`, 53 AS `radical_id`
    UNION ALL
    SELECT '树' AS `hanzi`, 'shu' AS `pinyin_raw`, 75 AS `radical_id`
    UNION ALL
    SELECT '水' AS `hanzi`, 'shui' AS `pinyin_raw`, 85 AS `radical_id`
    UNION ALL
    SELECT '水果' AS `hanzi`, 'shuiguo' AS `pinyin_raw`, 75 AS `radical_id`
    UNION ALL
    SELECT '水果' AS `hanzi`, 'shuiguo' AS `pinyin_raw`, 85 AS `radical_id`
    UNION ALL
    SELECT '睡' AS `hanzi`, 'shui' AS `pinyin_raw`, 109 AS `radical_id`
    UNION ALL
    SELECT '睡觉' AS `hanzi`, 'shuijiao' AS `pinyin_raw`, 109 AS `radical_id`
    UNION ALL
    SELECT '睡觉' AS `hanzi`, 'shuijiao' AS `pinyin_raw`, 147 AS `radical_id`
    UNION ALL
    SELECT '说' AS `hanzi`, 'shuo' AS `pinyin_raw`, 149 AS `radical_id`
    UNION ALL
    SELECT '说话' AS `hanzi`, 'shuohua' AS `pinyin_raw`, 149 AS `radical_id`
    UNION ALL
    SELECT '四' AS `hanzi`, 'si' AS `pinyin_raw`, 31 AS `radical_id`
    UNION ALL
    SELECT '送' AS `hanzi`, 'song' AS `pinyin_raw`, 162 AS `radical_id`
    UNION ALL
    SELECT '岁' AS `hanzi`, 'sui' AS `pinyin_raw`, 46 AS `radical_id`
    UNION ALL
    SELECT '他' AS `hanzi`, 'ta' AS `pinyin_raw`, 9 AS `radical_id`
    UNION ALL
    SELECT '他们' AS `hanzi`, 'tamen' AS `pinyin_raw`, 9 AS `radical_id`
    UNION ALL
    SELECT '她' AS `hanzi`, 'ta' AS `pinyin_raw`, 38 AS `radical_id`
    UNION ALL
    SELECT '她们' AS `hanzi`, 'tamen' AS `pinyin_raw`, 9 AS `radical_id`
    UNION ALL
    SELECT '她们' AS `hanzi`, 'tamen' AS `pinyin_raw`, 38 AS `radical_id`
    UNION ALL
    SELECT '太' AS `hanzi`, 'tai' AS `pinyin_raw`, 37 AS `radical_id`
    UNION ALL
    SELECT '天' AS `hanzi`, 'tian' AS `pinyin_raw`, 37 AS `radical_id`
    UNION ALL
    SELECT '天气' AS `hanzi`, 'tianqi' AS `pinyin_raw`, 37 AS `radical_id`
    UNION ALL
    SELECT '天气' AS `hanzi`, 'tianqi' AS `pinyin_raw`, 84 AS `radical_id`
    UNION ALL
    SELECT '听' AS `hanzi`, 'ting' AS `pinyin_raw`, 30 AS `radical_id`
    UNION ALL
    SELECT '听到' AS `hanzi`, 'tingdao' AS `pinyin_raw`, 18 AS `radical_id`
    UNION ALL
    SELECT '听到' AS `hanzi`, 'tingdao' AS `pinyin_raw`, 30 AS `radical_id`
    UNION ALL
    SELECT '听见' AS `hanzi`, 'tingjian' AS `pinyin_raw`, 30 AS `radical_id`
    UNION ALL
    SELECT '听见' AS `hanzi`, 'tingjian' AS `pinyin_raw`, 147 AS `radical_id`
    UNION ALL
    SELECT '听写' AS `hanzi`, 'tingxie' AS `pinyin_raw`, 14 AS `radical_id`
    UNION ALL
    SELECT '听写' AS `hanzi`, 'tingxie' AS `pinyin_raw`, 30 AS `radical_id`
    UNION ALL
    SELECT '同学' AS `hanzi`, 'tongxue' AS `pinyin_raw`, 30 AS `radical_id`
    UNION ALL
    SELECT '同学' AS `hanzi`, 'tongxue' AS `pinyin_raw`, 39 AS `radical_id`
    UNION ALL
    SELECT '图书馆' AS `hanzi`, 'tushuguan' AS `pinyin_raw`, 5 AS `radical_id`
    UNION ALL
    SELECT '图书馆' AS `hanzi`, 'tushuguan' AS `pinyin_raw`, 31 AS `radical_id`
    UNION ALL
    SELECT '图书馆' AS `hanzi`, 'tushuguan' AS `pinyin_raw`, 184 AS `radical_id`
    UNION ALL
    SELECT '外' AS `hanzi`, 'wai' AS `pinyin_raw`, 36 AS `radical_id`
    UNION ALL
    SELECT '外边' AS `hanzi`, 'waibian' AS `pinyin_raw`, 36 AS `radical_id`
    UNION ALL
    SELECT '外边' AS `hanzi`, 'waibian' AS `pinyin_raw`, 162 AS `radical_id`
    UNION ALL
    SELECT '外国' AS `hanzi`, 'waiguo' AS `pinyin_raw`, 31 AS `radical_id`
    UNION ALL
    SELECT '外国' AS `hanzi`, 'waiguo' AS `pinyin_raw`, 36 AS `radical_id`
    UNION ALL
    SELECT '外语' AS `hanzi`, 'waiyu' AS `pinyin_raw`, 36 AS `radical_id`
    UNION ALL
    SELECT '外语' AS `hanzi`, 'waiyu' AS `pinyin_raw`, 149 AS `radical_id`
    UNION ALL
    SELECT '玩儿' AS `hanzi`, 'wanr' AS `pinyin_raw`, 10 AS `radical_id`
    UNION ALL
    SELECT '玩儿' AS `hanzi`, 'wanr' AS `pinyin_raw`, 96 AS `radical_id`
    UNION ALL
    SELECT '晚' AS `hanzi`, 'wan' AS `pinyin_raw`, 72 AS `radical_id`
    UNION ALL
    SELECT '晚饭' AS `hanzi`, 'wanfan' AS `pinyin_raw`, 72 AS `radical_id`
    UNION ALL
    SELECT '晚饭' AS `hanzi`, 'wanfan' AS `pinyin_raw`, 184 AS `radical_id`
    UNION ALL
    SELECT '晚上' AS `hanzi`, 'wanshang' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '晚上' AS `hanzi`, 'wanshang' AS `pinyin_raw`, 72 AS `radical_id`
    UNION ALL
    SELECT '网上' AS `hanzi`, 'wang shang' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '网上' AS `hanzi`, 'wang shang' AS `pinyin_raw`, 122 AS `radical_id`
    UNION ALL
    SELECT '网友' AS `hanzi`, 'wangyou' AS `pinyin_raw`, 29 AS `radical_id`
    UNION ALL
    SELECT '网友' AS `hanzi`, 'wangyou' AS `pinyin_raw`, 122 AS `radical_id`
    UNION ALL
    SELECT '忘' AS `hanzi`, 'wang' AS `pinyin_raw`, 61 AS `radical_id`
    UNION ALL
    SELECT '忘记' AS `hanzi`, 'wangji' AS `pinyin_raw`, 61 AS `radical_id`
    UNION ALL
    SELECT '忘记' AS `hanzi`, 'wangji' AS `pinyin_raw`, 149 AS `radical_id`
    UNION ALL
    SELECT '问' AS `hanzi`, 'wen' AS `pinyin_raw`, 169 AS `radical_id`
    UNION ALL
    SELECT '我' AS `hanzi`, 'wo' AS `pinyin_raw`, 62 AS `radical_id`
    UNION ALL
    SELECT '我们' AS `hanzi`, 'women' AS `pinyin_raw`, 9 AS `radical_id`
    UNION ALL
    SELECT '我们' AS `hanzi`, 'women' AS `pinyin_raw`, 62 AS `radical_id`
    UNION ALL
    SELECT '五' AS `hanzi`, 'wu' AS `pinyin_raw`, 7 AS `radical_id`
    UNION ALL
    SELECT '午饭' AS `hanzi`, 'wufan' AS `pinyin_raw`, 24 AS `radical_id`
    UNION ALL
    SELECT '午饭' AS `hanzi`, 'wufan' AS `pinyin_raw`, 184 AS `radical_id`
    UNION ALL
    SELECT '西' AS `hanzi`, 'xi' AS `pinyin_raw`, 146 AS `radical_id`
    UNION ALL
    SELECT '西边' AS `hanzi`, 'xibian' AS `pinyin_raw`, 146 AS `radical_id`
    UNION ALL
    SELECT '西边' AS `hanzi`, 'xibian' AS `pinyin_raw`, 162 AS `radical_id`
    UNION ALL
    SELECT '洗' AS `hanzi`, 'xi' AS `pinyin_raw`, 85 AS `radical_id`
    UNION ALL
    SELECT '洗手间' AS `hanzi`, 'xishoujian' AS `pinyin_raw`, 64 AS `radical_id`
    UNION ALL
    SELECT '洗手间' AS `hanzi`, 'xishoujian' AS `pinyin_raw`, 85 AS `radical_id`
    UNION ALL
    SELECT '洗手间' AS `hanzi`, 'xishoujian' AS `pinyin_raw`, 169 AS `radical_id`
    UNION ALL
    SELECT '喜欢' AS `hanzi`, 'xihuan' AS `pinyin_raw`, 30 AS `radical_id`
    UNION ALL
    SELECT '喜欢' AS `hanzi`, 'xihuan' AS `pinyin_raw`, 76 AS `radical_id`
    UNION ALL
    SELECT '下' AS `hanzi`, 'xia' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '下班' AS `hanzi`, 'xiaban' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '下班' AS `hanzi`, 'xiaban' AS `pinyin_raw`, 96 AS `radical_id`
    UNION ALL
    SELECT '下边' AS `hanzi`, 'xiabian' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '下边' AS `hanzi`, 'xiabian' AS `pinyin_raw`, 162 AS `radical_id`
    UNION ALL
    SELECT '下车' AS `hanzi`, 'xia che' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '下车' AS `hanzi`, 'xia che' AS `pinyin_raw`, 159 AS `radical_id`
    UNION ALL
    SELECT '下次' AS `hanzi`, 'xia ci' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '下次' AS `hanzi`, 'xia ci' AS `pinyin_raw`, 76 AS `radical_id`
    UNION ALL
    SELECT '下课' AS `hanzi`, 'xiake' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '下课' AS `hanzi`, 'xiake' AS `pinyin_raw`, 149 AS `radical_id`
    UNION ALL
    SELECT '下午' AS `hanzi`, 'xiawu' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '下午' AS `hanzi`, 'xiawu' AS `pinyin_raw`, 24 AS `radical_id`
    UNION ALL
    SELECT '下雨' AS `hanzi`, 'xia yu' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '下雨' AS `hanzi`, 'xia yu' AS `pinyin_raw`, 173 AS `radical_id`
    UNION ALL
    SELECT '先' AS `hanzi`, 'xian' AS `pinyin_raw`, 10 AS `radical_id`
    UNION ALL
    SELECT '先生' AS `hanzi`, 'xiansheng' AS `pinyin_raw`, 10 AS `radical_id`
    UNION ALL
    SELECT '先生' AS `hanzi`, 'xiansheng' AS `pinyin_raw`, 100 AS `radical_id`
    UNION ALL
    SELECT '现在' AS `hanzi`, 'xianzai' AS `pinyin_raw`, 32 AS `radical_id`
    UNION ALL
    SELECT '现在' AS `hanzi`, 'xianzai' AS `pinyin_raw`, 96 AS `radical_id`
    UNION ALL
    SELECT '想' AS `hanzi`, 'xiang' AS `pinyin_raw`, 61 AS `radical_id`
    UNION ALL
    SELECT '小' AS `hanzi`, 'xiao' AS `pinyin_raw`, 42 AS `radical_id`
    UNION ALL
    SELECT '小孩儿' AS `hanzi`, 'xiaohair' AS `pinyin_raw`, 10 AS `radical_id`
    UNION ALL
    SELECT '小孩儿' AS `hanzi`, 'xiaohair' AS `pinyin_raw`, 39 AS `radical_id`
    UNION ALL
    SELECT '小孩儿' AS `hanzi`, 'xiaohair' AS `pinyin_raw`, 42 AS `radical_id`
    UNION ALL
    SELECT '小姐' AS `hanzi`, 'xiaojie' AS `pinyin_raw`, 38 AS `radical_id`
    UNION ALL
    SELECT '小姐' AS `hanzi`, 'xiaojie' AS `pinyin_raw`, 42 AS `radical_id`
    UNION ALL
    SELECT '小朋友' AS `hanzi`, 'xiaopengyou' AS `pinyin_raw`, 29 AS `radical_id`
    UNION ALL
    SELECT '小朋友' AS `hanzi`, 'xiaopengyou' AS `pinyin_raw`, 42 AS `radical_id`
    UNION ALL
    SELECT '小朋友' AS `hanzi`, 'xiaopengyou' AS `pinyin_raw`, 74 AS `radical_id`
    UNION ALL
    SELECT '小时' AS `hanzi`, 'xiaoshi' AS `pinyin_raw`, 42 AS `radical_id`
    UNION ALL
    SELECT '小时' AS `hanzi`, 'xiaoshi' AS `pinyin_raw`, 72 AS `radical_id`
    UNION ALL
    SELECT '小学' AS `hanzi`, 'xiaoxue' AS `pinyin_raw`, 39 AS `radical_id`
    UNION ALL
    SELECT '小学' AS `hanzi`, 'xiaoxue' AS `pinyin_raw`, 42 AS `radical_id`
    UNION ALL
    SELECT '小学生' AS `hanzi`, 'xiaoxuesheng' AS `pinyin_raw`, 39 AS `radical_id`
    UNION ALL
    SELECT '小学生' AS `hanzi`, 'xiaoxuesheng' AS `pinyin_raw`, 42 AS `radical_id`
    UNION ALL
    SELECT '小学生' AS `hanzi`, 'xiaoxuesheng' AS `pinyin_raw`, 100 AS `radical_id`
    UNION ALL
    SELECT '笑' AS `hanzi`, 'xiao' AS `pinyin_raw`, 118 AS `radical_id`
    UNION ALL
    SELECT '写' AS `hanzi`, 'xie' AS `pinyin_raw`, 14 AS `radical_id`
    UNION ALL
    SELECT '谢谢' AS `hanzi`, 'xiexie' AS `pinyin_raw`, 149 AS `radical_id`
    UNION ALL
    SELECT '新' AS `hanzi`, 'xin' AS `pinyin_raw`, 69 AS `radical_id`
    UNION ALL
    SELECT '新年' AS `hanzi`, 'xinnian' AS `pinyin_raw`, 51 AS `radical_id`
    UNION ALL
    SELECT '新年' AS `hanzi`, 'xinnian' AS `pinyin_raw`, 69 AS `radical_id`
    UNION ALL
    SELECT '星期' AS `hanzi`, 'xingqi' AS `pinyin_raw`, 72 AS `radical_id`
    UNION ALL
    SELECT '星期' AS `hanzi`, 'xingqi' AS `pinyin_raw`, 74 AS `radical_id`
    UNION ALL
    SELECT '星期日' AS `hanzi`, 'xingqiri' AS `pinyin_raw`, 72 AS `radical_id`
    UNION ALL
    SELECT '星期日' AS `hanzi`, 'xingqiri' AS `pinyin_raw`, 74 AS `radical_id`
    UNION ALL
    SELECT '星期天' AS `hanzi`, 'xingqitian' AS `pinyin_raw`, 37 AS `radical_id`
    UNION ALL
    SELECT '星期天' AS `hanzi`, 'xingqitian' AS `pinyin_raw`, 72 AS `radical_id`
    UNION ALL
    SELECT '星期天' AS `hanzi`, 'xingqitian' AS `pinyin_raw`, 74 AS `radical_id`
    UNION ALL
    SELECT '行' AS `hanzi`, 'xing' AS `pinyin_raw`, 144 AS `radical_id`
    UNION ALL
    SELECT '休息' AS `hanzi`, 'xiuxi' AS `pinyin_raw`, 9 AS `radical_id`
    UNION ALL
    SELECT '休息' AS `hanzi`, 'xiuxi' AS `pinyin_raw`, 61 AS `radical_id`
    UNION ALL
    SELECT '学' AS `hanzi`, 'xue' AS `pinyin_raw`, 39 AS `radical_id`
    UNION ALL
    SELECT '学生' AS `hanzi`, 'xuesheng' AS `pinyin_raw`, 39 AS `radical_id`
    UNION ALL
    SELECT '学生' AS `hanzi`, 'xuesheng' AS `pinyin_raw`, 100 AS `radical_id`
    UNION ALL
    SELECT '学习' AS `hanzi`, 'xuexi' AS `pinyin_raw`, 5 AS `radical_id`
    UNION ALL
    SELECT '学习' AS `hanzi`, 'xuexi' AS `pinyin_raw`, 39 AS `radical_id`
    UNION ALL
    SELECT '学校' AS `hanzi`, 'xuexiao' AS `pinyin_raw`, 39 AS `radical_id`
    UNION ALL
    SELECT '学校' AS `hanzi`, 'xuexiao' AS `pinyin_raw`, 75 AS `radical_id`
    UNION ALL
    SELECT '学院' AS `hanzi`, 'xueyuan' AS `pinyin_raw`, 39 AS `radical_id`
    UNION ALL
    SELECT '学院' AS `hanzi`, 'xueyuan' AS `pinyin_raw`, 170 AS `radical_id`
    UNION ALL
    SELECT '要' AS `hanzi`, 'yao' AS `pinyin_raw`, 146 AS `radical_id`
    UNION ALL
    SELECT '爷爷' AS `hanzi`, 'yeye' AS `pinyin_raw`, 88 AS `radical_id`
    UNION ALL
    SELECT '也' AS `hanzi`, 'ye' AS `pinyin_raw`, 5 AS `radical_id`
    UNION ALL
    SELECT '页' AS `hanzi`, 'ye' AS `pinyin_raw`, 181 AS `radical_id`
    UNION ALL
    SELECT '一' AS `hanzi`, 'yi' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '衣服' AS `hanzi`, 'yifu' AS `pinyin_raw`, 74 AS `radical_id`
    UNION ALL
    SELECT '衣服' AS `hanzi`, 'yifu' AS `pinyin_raw`, 145 AS `radical_id`
    UNION ALL
    SELECT '医生' AS `hanzi`, 'yisheng' AS `pinyin_raw`, 23 AS `radical_id`
    UNION ALL
    SELECT '医生' AS `hanzi`, 'yisheng' AS `pinyin_raw`, 100 AS `radical_id`
    UNION ALL
    SELECT '医院' AS `hanzi`, 'yiyuan' AS `pinyin_raw`, 23 AS `radical_id`
    UNION ALL
    SELECT '医院' AS `hanzi`, 'yiyuan' AS `pinyin_raw`, 170 AS `radical_id`
    UNION ALL
    SELECT '一半' AS `hanzi`, 'yiban' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '一半' AS `hanzi`, 'yiban' AS `pinyin_raw`, 24 AS `radical_id`
    UNION ALL
    SELECT '一会儿' AS `hanzi`, 'yihuir' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '一会儿' AS `hanzi`, 'yihuir' AS `pinyin_raw`, 9 AS `radical_id`
    UNION ALL
    SELECT '一会儿' AS `hanzi`, 'yihuir' AS `pinyin_raw`, 10 AS `radical_id`
    UNION ALL
    SELECT '一块儿' AS `hanzi`, 'yikuair' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '一块儿' AS `hanzi`, 'yikuair' AS `pinyin_raw`, 10 AS `radical_id`
    UNION ALL
    SELECT '一块儿' AS `hanzi`, 'yikuair' AS `pinyin_raw`, 32 AS `radical_id`
    UNION ALL
    SELECT '一下儿' AS `hanzi`, 'yixiar' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '一下儿' AS `hanzi`, 'yixiar' AS `pinyin_raw`, 10 AS `radical_id`
    UNION ALL
    SELECT '一样' AS `hanzi`, 'yiyang' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '一样' AS `hanzi`, 'yiyang' AS `pinyin_raw`, 75 AS `radical_id`
    UNION ALL
    SELECT '一边' AS `hanzi`, 'yibian' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '一边' AS `hanzi`, 'yibian' AS `pinyin_raw`, 162 AS `radical_id`
    UNION ALL
    SELECT '一点儿' AS `hanzi`, 'yidianr' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '一点儿' AS `hanzi`, 'yidianr' AS `pinyin_raw`, 10 AS `radical_id`
    UNION ALL
    SELECT '一点儿' AS `hanzi`, 'yidianr' AS `pinyin_raw`, 86 AS `radical_id`
    UNION ALL
    SELECT '一起' AS `hanzi`, 'yiqi' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '一起' AS `hanzi`, 'yiqi' AS `pinyin_raw`, 156 AS `radical_id`
    UNION ALL
    SELECT '一些' AS `hanzi`, 'yixie' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '一些' AS `hanzi`, 'yixie' AS `pinyin_raw`, 7 AS `radical_id`
    UNION ALL
    SELECT '用' AS `hanzi`, 'yong' AS `pinyin_raw`, 101 AS `radical_id`
    UNION ALL
    SELECT '有' AS `hanzi`, 'you' AS `pinyin_raw`, 74 AS `radical_id`
    UNION ALL
    SELECT '有的' AS `hanzi`, 'youde' AS `pinyin_raw`, 74 AS `radical_id`
    UNION ALL
    SELECT '有的' AS `hanzi`, 'youde' AS `pinyin_raw`, 106 AS `radical_id`
    UNION ALL
    SELECT '有名' AS `hanzi`, 'youming' AS `pinyin_raw`, 30 AS `radical_id`
    UNION ALL
    SELECT '有名' AS `hanzi`, 'youming' AS `pinyin_raw`, 74 AS `radical_id`
    UNION ALL
    SELECT '有时候' AS `hanzi`, 'youshihou' AS `pinyin_raw`, 9 AS `radical_id`
    UNION ALL
    SELECT '有时候' AS `hanzi`, 'youshihou' AS `pinyin_raw`, 72 AS `radical_id`
    UNION ALL
    SELECT '有时候' AS `hanzi`, 'youshihou' AS `pinyin_raw`, 74 AS `radical_id`
    UNION ALL
    SELECT '有些' AS `hanzi`, 'you(yi)xie' AS `pinyin_raw`, 7 AS `radical_id`
    UNION ALL
    SELECT '有些' AS `hanzi`, 'you(yi)xie' AS `pinyin_raw`, 74 AS `radical_id`
    UNION ALL
    SELECT '有用' AS `hanzi`, 'youyong' AS `pinyin_raw`, 74 AS `radical_id`
    UNION ALL
    SELECT '有用' AS `hanzi`, 'youyong' AS `pinyin_raw`, 101 AS `radical_id`
    UNION ALL
    SELECT '右' AS `hanzi`, 'you' AS `pinyin_raw`, 30 AS `radical_id`
    UNION ALL
    SELECT '右边' AS `hanzi`, 'youbian' AS `pinyin_raw`, 30 AS `radical_id`
    UNION ALL
    SELECT '右边' AS `hanzi`, 'youbian' AS `pinyin_raw`, 162 AS `radical_id`
    UNION ALL
    SELECT '雨' AS `hanzi`, 'yu' AS `pinyin_raw`, 173 AS `radical_id`
    UNION ALL
    SELECT '元' AS `hanzi`, 'yuan' AS `pinyin_raw`, 10 AS `radical_id`
    UNION ALL
    SELECT '远' AS `hanzi`, 'yuan' AS `pinyin_raw`, 162 AS `radical_id`
    UNION ALL
    SELECT '月' AS `hanzi`, 'yue' AS `pinyin_raw`, 74 AS `radical_id`
    UNION ALL
    SELECT '再' AS `hanzi`, 'zai' AS `pinyin_raw`, 13 AS `radical_id`
    UNION ALL
    SELECT '再见' AS `hanzi`, 'zaijian' AS `pinyin_raw`, 13 AS `radical_id`
    UNION ALL
    SELECT '再见' AS `hanzi`, 'zaijian' AS `pinyin_raw`, 147 AS `radical_id`
    UNION ALL
    SELECT '在' AS `hanzi`, 'zai' AS `pinyin_raw`, 32 AS `radical_id`
    UNION ALL
    SELECT '在家' AS `hanzi`, 'zaijia' AS `pinyin_raw`, 32 AS `radical_id`
    UNION ALL
    SELECT '在家' AS `hanzi`, 'zaijia' AS `pinyin_raw`, 40 AS `radical_id`
    UNION ALL
    SELECT '早' AS `hanzi`, 'zao' AS `pinyin_raw`, 72 AS `radical_id`
    UNION ALL
    SELECT '早饭' AS `hanzi`, 'zaofan' AS `pinyin_raw`, 72 AS `radical_id`
    UNION ALL
    SELECT '早饭' AS `hanzi`, 'zaofan' AS `pinyin_raw`, 184 AS `radical_id`
    UNION ALL
    SELECT '早上' AS `hanzi`, 'zaoshang' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '早上' AS `hanzi`, 'zaoshang' AS `pinyin_raw`, 72 AS `radical_id`
    UNION ALL
    SELECT '怎么' AS `hanzi`, 'zenme' AS `pinyin_raw`, 4 AS `radical_id`
    UNION ALL
    SELECT '怎么' AS `hanzi`, 'zenme' AS `pinyin_raw`, 61 AS `radical_id`
    UNION ALL
    SELECT '站' AS `hanzi`, 'zhan' AS `pinyin_raw`, 117 AS `radical_id`
    UNION ALL
    SELECT '找' AS `hanzi`, 'zhao' AS `pinyin_raw`, 64 AS `radical_id`
    UNION ALL
    SELECT '找到' AS `hanzi`, 'zhaodao' AS `pinyin_raw`, 18 AS `radical_id`
    UNION ALL
    SELECT '找到' AS `hanzi`, 'zhaodao' AS `pinyin_raw`, 64 AS `radical_id`
    UNION ALL
    SELECT '这' AS `hanzi`, 'zhe' AS `pinyin_raw`, 162 AS `radical_id`
    UNION ALL
    SELECT '这边' AS `hanzi`, 'zhebian' AS `pinyin_raw`, 162 AS `radical_id`
    UNION ALL
    SELECT '这里' AS `hanzi`, 'zheli' AS `pinyin_raw`, 162 AS `radical_id`
    UNION ALL
    SELECT '这里' AS `hanzi`, 'zheli' AS `pinyin_raw`, 166 AS `radical_id`
    UNION ALL
    SELECT '这儿' AS `hanzi`, 'zher' AS `pinyin_raw`, 10 AS `radical_id`
    UNION ALL
    SELECT '这儿' AS `hanzi`, 'zher' AS `pinyin_raw`, 162 AS `radical_id`
    UNION ALL
    SELECT '这些' AS `hanzi`, 'zhexie' AS `pinyin_raw`, 7 AS `radical_id`
    UNION ALL
    SELECT '这些' AS `hanzi`, 'zhexie' AS `pinyin_raw`, 162 AS `radical_id`
    UNION ALL
    SELECT '着' AS `hanzi`, 'zhe' AS `pinyin_raw`, 109 AS `radical_id`
    UNION ALL
    SELECT '真' AS `hanzi`, 'zhen' AS `pinyin_raw`, 109 AS `radical_id`
    UNION ALL
    SELECT '真的' AS `hanzi`, 'zhen de' AS `pinyin_raw`, 106 AS `radical_id`
    UNION ALL
    SELECT '真的' AS `hanzi`, 'zhen de' AS `pinyin_raw`, 109 AS `radical_id`
    UNION ALL
    SELECT '正' AS `hanzi`, 'zheng' AS `pinyin_raw`, 77 AS `radical_id`
    UNION ALL
    SELECT '正在' AS `hanzi`, 'zhengzai' AS `pinyin_raw`, 32 AS `radical_id`
    UNION ALL
    SELECT '正在' AS `hanzi`, 'zhengzai' AS `pinyin_raw`, 77 AS `radical_id`
    UNION ALL
    SELECT '知道' AS `hanzi`, 'zhidao' AS `pinyin_raw`, 111 AS `radical_id`
    UNION ALL
    SELECT '知道' AS `hanzi`, 'zhidao' AS `pinyin_raw`, 162 AS `radical_id`
    UNION ALL
    SELECT '知识' AS `hanzi`, 'zhishi' AS `pinyin_raw`, 111 AS `radical_id`
    UNION ALL
    SELECT '知识' AS `hanzi`, 'zhishi' AS `pinyin_raw`, 149 AS `radical_id`
    UNION ALL
    SELECT '中' AS `hanzi`, 'zhong' AS `pinyin_raw`, 2 AS `radical_id`
    UNION ALL
    SELECT '中国' AS `hanzi`, 'zhongguo' AS `pinyin_raw`, 2 AS `radical_id`
    UNION ALL
    SELECT '中国' AS `hanzi`, 'zhongguo' AS `pinyin_raw`, 31 AS `radical_id`
    UNION ALL
    SELECT '中间' AS `hanzi`, 'zhongjian' AS `pinyin_raw`, 2 AS `radical_id`
    UNION ALL
    SELECT '中间' AS `hanzi`, 'zhongjian' AS `pinyin_raw`, 169 AS `radical_id`
    UNION ALL
    SELECT '中文' AS `hanzi`, 'zhongwen' AS `pinyin_raw`, 2 AS `radical_id`
    UNION ALL
    SELECT '中文' AS `hanzi`, 'zhongwen' AS `pinyin_raw`, 67 AS `radical_id`
    UNION ALL
    SELECT '中午' AS `hanzi`, 'zhongwu' AS `pinyin_raw`, 2 AS `radical_id`
    UNION ALL
    SELECT '中午' AS `hanzi`, 'zhongwu' AS `pinyin_raw`, 24 AS `radical_id`
    UNION ALL
    SELECT '中学' AS `hanzi`, 'zhongxue' AS `pinyin_raw`, 2 AS `radical_id`
    UNION ALL
    SELECT '中学' AS `hanzi`, 'zhongxue' AS `pinyin_raw`, 39 AS `radical_id`
    UNION ALL
    SELECT '中学生' AS `hanzi`, 'zhongxuesheng' AS `pinyin_raw`, 2 AS `radical_id`
    UNION ALL
    SELECT '中学生' AS `hanzi`, 'zhongxuesheng' AS `pinyin_raw`, 39 AS `radical_id`
    UNION ALL
    SELECT '中学生' AS `hanzi`, 'zhongxuesheng' AS `pinyin_raw`, 100 AS `radical_id`
    UNION ALL
    SELECT '重' AS `hanzi`, 'zhong' AS `pinyin_raw`, 166 AS `radical_id`
    UNION ALL
    SELECT '重要' AS `hanzi`, 'zhongyao' AS `pinyin_raw`, 146 AS `radical_id`
    UNION ALL
    SELECT '重要' AS `hanzi`, 'zhongyao' AS `pinyin_raw`, 166 AS `radical_id`
    UNION ALL
    SELECT '住' AS `hanzi`, 'zhu' AS `pinyin_raw`, 9 AS `radical_id`
    UNION ALL
    SELECT '准备' AS `hanzi`, 'zhunbei' AS `pinyin_raw`, 15 AS `radical_id`
    UNION ALL
    SELECT '准备' AS `hanzi`, 'zhunbei' AS `pinyin_raw`, 34 AS `radical_id`
    UNION ALL
    SELECT '桌子' AS `hanzi`, 'zhuozi' AS `pinyin_raw`, 39 AS `radical_id`
    UNION ALL
    SELECT '桌子' AS `hanzi`, 'zhuozi' AS `pinyin_raw`, 75 AS `radical_id`
    UNION ALL
    SELECT '字' AS `hanzi`, 'zi' AS `pinyin_raw`, 39 AS `radical_id`
    UNION ALL
    SELECT '子' AS `hanzi`, 'zi (zhuozi)' AS `pinyin_raw`, 39 AS `radical_id`
    UNION ALL
    SELECT '走' AS `hanzi`, 'zou' AS `pinyin_raw`, 156 AS `radical_id`
    UNION ALL
    SELECT '走路' AS `hanzi`, 'zoulu' AS `pinyin_raw`, 156 AS `radical_id`
    UNION ALL
    SELECT '走路' AS `hanzi`, 'zoulu' AS `pinyin_raw`, 157 AS `radical_id`
    UNION ALL
    SELECT '最' AS `hanzi`, 'zui' AS `pinyin_raw`, 13 AS `radical_id`
    UNION ALL
    SELECT '最好' AS `hanzi`, 'zuihao' AS `pinyin_raw`, 13 AS `radical_id`
    UNION ALL
    SELECT '最好' AS `hanzi`, 'zuihao' AS `pinyin_raw`, 38 AS `radical_id`
    UNION ALL
    SELECT '最后' AS `hanzi`, 'zuihou' AS `pinyin_raw`, 13 AS `radical_id`
    UNION ALL
    SELECT '最后' AS `hanzi`, 'zuihou' AS `pinyin_raw`, 30 AS `radical_id`
    UNION ALL
    SELECT '昨天' AS `hanzi`, 'zuotian' AS `pinyin_raw`, 37 AS `radical_id`
    UNION ALL
    SELECT '昨天' AS `hanzi`, 'zuotian' AS `pinyin_raw`, 72 AS `radical_id`
    UNION ALL
    SELECT '左' AS `hanzi`, 'zuo' AS `pinyin_raw`, 48 AS `radical_id`
    UNION ALL
    SELECT '左边' AS `hanzi`, 'zuobian' AS `pinyin_raw`, 48 AS `radical_id`
    UNION ALL
    SELECT '左边' AS `hanzi`, 'zuobian' AS `pinyin_raw`, 162 AS `radical_id`
    UNION ALL
    SELECT '坐' AS `hanzi`, 'zuo' AS `pinyin_raw`, 32 AS `radical_id`
    UNION ALL
    SELECT '坐下' AS `hanzi`, 'zuo xia' AS `pinyin_raw`, 1 AS `radical_id`
    UNION ALL
    SELECT '坐下' AS `hanzi`, 'zuo xia' AS `pinyin_raw`, 32 AS `radical_id`
    UNION ALL
    SELECT '做' AS `hanzi`, 'zuo' AS `pinyin_raw`, 9 AS `radical_id`
) AS mapping
JOIN `VOCABULARY` v ON v.`hanzi` = mapping.`hanzi` AND v.`pinyin_raw` = mapping.`pinyin_raw`;
