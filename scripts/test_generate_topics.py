import json, re, sys
sys.stdout.reconfigure(encoding='utf-8')

with open('frontend/js/api/demo-seed-data.js', encoding='utf-8') as f:
    text = f.read()

pos_vocab = text.find('export const SEED_VOCABULARY =')
pos_lessons = text.find('export const SEED_LESSONS =')
vocab_text = text[pos_vocab:pos_lessons]
start = vocab_text.find('[')
end = vocab_text.rfind(']')
vocab_json = json.loads(vocab_text[start:end+1])

hsk1 = [v for v in vocab_json if v.get('hskLevel') == 1]
hsk2 = [v for v in vocab_json if v.get('hskLevel') == 2]
hsk3 = [v for v in vocab_json if v.get('hskLevel') == 3]

hsk1.sort(key=lambda x: x.get('hskSourceId', 0))
hsk2.sort(key=lambda x: x.get('hskSourceId', 0))
hsk3.sort(key=lambda x: x.get('hskSourceId', 0))

def make_vocab_entry(v):
    return {
        "vocabId": v["vocabId"],
        "hanzi": v["hanzi"],
        "pinyin": v["pinyin"],
        "meaningHanViet": v.get("meaningHanViet", ""),
        "meaningVi": v.get("meaningVi", ""),
        "exampleSentence": v.get("exampleSentence", ""),
        "exampleTranslation": v.get("exampleTranslation", "")
    }

# 15 HSK 1 topics
hsk1_titles = [
    ("Bài 01 — Gia đình, Chào hỏi & Đời sống (001–020)", "爱, 八, 爸爸, 吧, 白天, 百, 半, 包子, 杯子, 本, 边, 病, 不, 不客气, 不要, 菜, 茶, 唱, 超市, 车"),
    ("Bài 02 — Phương tiện, Trường học & Thiết bị (021–040)", "车站, 吃, 出租车, 穿, 大家, 打电话, 大, 大学, 大学生, 到, 的, 弟弟, 第, 点, 电话, 电脑, 电视, 电影, 电影院, 店"),
    ("Bài 03 — Thời gian, Ăn uống & Cảm xúc (041–060)", "东西, 都, 读, 读书, 对, 对不起, 多, 多少, 儿子, 二, 饭, 饭店, 房间, 分, 分钟, 飞机, 非常, 高兴, 哥哥, 歌"),
    ("Bài 04 — Công việc, Ngôn ngữ & Tính từ cơ bản (061–080)", "个, 给, 工作, 狗, 贵, 国, 还, 孩子, 汉语, 汉字, 好, 好吃, 好看, 好听, 好玩儿, 号, 喝, 和, 很, 后"),
    ("Bài 05 — Thời gian, Gia đình & Hoạt động thường nhật (081–100)", "回, 会, 火车, 鸡蛋, 几, 件, 家, 家人, 见, 叫, 饺子, 姐姐, 今年, 今天, 九, 觉得, 开, 开车, 看, 看病"),
    ("Bài 06 — Mua bán, Thầy cô & Số đếm (101–120)", "看见, 可以, 课, 口, 块, 来, 老师, 了, 冷, 里, 两, 零, 六, 妈妈, 吗, 买, 卖, 忙, 猫, 没关系"),
    ("Bài 07 — Ẩm thực, Đại từ chỉ định & Nơi chốn (121–140)", "没有, 没事, 妹妹, 们, 米饭, 面包, 面条儿, 名字, 明年, 明天, 哪, 哪个, 哪里, 哪儿, 哪些, 那, 那个, 那边, 那里, 那儿"),
    ("Bài 08 — Đại từ xưng hô, Mối quan hệ & Đời sống (141–160)", "那些, 男, 男朋友, 呢, 能, 你, 你好, 你们, 年, 您, 牛奶, 女, 女儿, 女朋友, 女士, 朋友, 便宜, 票, 漂亮, 苹果"),
    ("Bài 09 — Lễ nghi, Thời gian & Công việc hàng ngày (161–180)", "七, 起床, 千, 前, 钱, 请, 请问, 去, 去年, 热, 人, 认识, 日, 三, 商店, 上, 上班, 上课, 上午, 上学"),
    ("Bài 10 — Giờ giấc, Nhu cầu sinh hoạt & Trò chuyện (181–200)", "少, 谁, 什么, 生病, 十, 时候, 时间, 事, 是, 手机, 书, 书店, 水, 水果, 睡, 睡觉, 说, 说话, 四, 岁"),
    ("Bài 11 — Thời tiết, Đại từ & Lịch trình tuần (201–220)", "它, 它们, 太, 天, 天气, 听, 听见, 同学, 玩, 完, 晚, 晚饭, 晚上, 万, 往, 喂, 问, 问题, 我, 我们"),
    ("Bài 12 — Trang phục, Y tế & Sinh hoạt gia đình (221–240)", "五, 午饭, 西, 西瓜, 希望, 习惯, 洗, 洗手间, 喜欢, 下, 下班, 下课, 下午, 下雨, 先, 先生, 现在, 想, 小, 小姐"),
    ("Bài 13 — Bữa sáng, Chỉ dẫn vị trí & Không gian (241–260)", "小朋友, 小时, 小学, 小学生, 笑, 写, 谢谢, 新, 新年, 星期, 星期日, 星期天, 行, 休息, 学, 学生, 学习, 学校, 雪, 要"),
    ("Bài 14 — Hành động, Địa điểm & Cuộc sống học đường (261–280)", "也, 一, 衣服, 医生, 医院, 一半, 一共, 一起, 一下, 一点儿, 一些, 椅子, 意思, 阴, 音乐, 因为, 游泳, 有, 有点儿, 有的"),
    ("Bài 15 — Đồ vật, Động từ & Biểu đạt giao tiếp (281–300)", "有些, 雨, 元, 远, 运动, 再, 再见, 在, 早, 早饭, 早上, 怎么, 怎么样, 站, 找, 这, 这个, 这边, 这里, 这儿")
]

hsk1_topics = []
for i in range(15):
    chunk = hsk1[i*20:(i+1)*20]
    title, desc = hsk1_titles[i]
    hsk1_topics.append({
        "topicId": i + 1,
        "title": title,
        "description": desc,
        "vocabularies": [make_vocab_entry(v) for v in chunk]
    })

print(f"Generated {len(hsk1_topics)} HSK 1 topics, total words: {sum(len(t['vocabularies']) for t in hsk1_topics)}")
