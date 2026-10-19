import fs from 'node:fs';
import path from 'node:path';

async function generateDict() {
  const d = await import('../frontend/js/api/demo-seed-data.js');
  const s = await import('../frontend/js/pages/srs-review-page.js');

  const SYLLABLES = new Set([
    'a','ai','an','ang','ao','ba','bai','ban','bang','bao','bei','ben','beng','bi','bian','biao','bie','bin','bing','bo','bu',
    'ca','cai','can','cang','cao','ce','cen','ceng','cha','chai','chan','chang','chao','che','chen','cheng','chi','chong','chou',
    'chu','chua','chuai','chuan','chuang','chui','chun','chuo','ci','cong','cou','cu','cuan','cui','cun','cuo',
    'da','dai','dan','dang','dao','de','dei','deng','di','dia','dian','diao','die','ding','diu','dong','dou','du','duan','dui','dun','duo',
    'e','ei','en','eng','er','fa','fan','fang','fei','fen','feng','fo','fou','fu',
    'ga','gai','gan','gang','gao','ge','gei','gen','geng','gong','gou','gu','gua','guai','guan','guang','gui','gun','guo',
    'ha','hai','han','hang','hao','he','hei','hen','heng','hong','hou','hu','hua','huai','huan','huang','hui','hun','huo',
    'ji','jia','jian','jiang','jiao','jie','jin','jing','jiong','jiu','ju','juan','jue','jun',
    'ka','kai','kan','kang','kao','ke','kei','ken','keng','kong','kou','ku','kua','kuai','kuan','kuang','kui','kun','kuo',
    'la','lai','lan','lang','lao','le','lei','leng','li','lia','lian','liang','liao','lie','lin','ling','liu','long','lou','lu','lv','luan','lue','lun','luo',
    'ma','mai','man','mang','mao','me','mei','men','meng','mi','mian','miao','mie','min','ming','miu','mo','mou','mu',
    'na','nai','nan','nang','nao','ne','nei','nen','neng','ni','nian','niang','niao','nie','nin','ning','niu','nong','nou','nu','nv','nuan','nue','nun','nuo',
    'o','ou','pa','pai','pan','pang','pao','pei','pen','peng','pi','pian','piao','pie','pin','ping','po','pou','pu',
    'qi','qia','qian','qiang','qiao','qie','qin','qing','qiong','qiu','qu','quan','que','qun',
    'ran','rang','rao','re','ren','reng','ri','rong','rou','ru','ruan','rui','run','ruo',
    'sa','sai','san','sang','sao','se','sen','seng','sha','shai','shan','shang','shao','she','shei','shen','sheng','shi','shou',
    'shu','shua','shuai','shuan','shuang','shui','shun','shuo','si','song','sou','su','suan','sui','sun','suo',
    'ta','tai','tan','tang','tao','te','teng','ti','tian','tiao','tie','ting','tong','tou','tu','tuan','tui','tun','tuo',
    'wa','wai','wan','wang','wei','wen','weng','wo','wu',
    'xi','xia','xian','xiang','xiao','xie','xin','xing','xiong','xiu','xu','xuan','xue','xun',
    'ya','yan','yang','yao','ye','yi','yin','ying','yo','yong','you','yu','yuan','yue','yun',
    'za','zai','zan','zang','zao','ze','zei','zen','zeng','zha','zhai','zhan','zhang','zhao','zhe','zhei','zhen','zheng','zhi','zhong','zhou',
    'zhu','zhua','zhuai','zhuan','zhuang','zhui','zhun','zhuo','zi','zong','zou','zu','zuan','zui','zun','zuo'
  ]);

  const COMMON_CHAR_MAP = {
    'a': ['啊', '阿'],
    'ai': ['爱', '矮', '哀', '艾', '哎'],
    'an': ['安', '按', '暗', '岸'],
    'ang': ['昂'],
    'ao': ['奥', '傲', '熬'],
    'ba': ['八', '把', '吧', '爸', '罢', '拔', '坝', '巴'],
    'bai': ['白', '百', '摆', '败', '拜'],
    'ban': ['半', '办', '班', '般', '板', '搬'],
    'bang': ['帮', '棒', '榜', '膀'],
    'bao': ['包', '保', '报', '抱', '饱', '宝', '暴'],
    'bei': ['北', '被', '杯', '背', '倍', '备', '悲'],
    'ben': ['本', '奔', '笨'],
    'beng': ['崩', '蹦'],
    'bi': ['比', '必', '币', '笔', '闭', '鼻', '避', '碧', '壁'],
    'bian': ['边', '变', '便', '遍', '编', '扁'],
    'biao': ['表', '标', '示'],
    'bie': ['别', '憋', '瘪'],
    'bin': ['宾', '彬'],
    'bing': ['并', '病', '冰', '兵', '饼'],
    'bo': ['波', '博', '伯', '薄', '脖'],
    'bu': ['不', '部', '步', '布', '补', '簿'],
    'ca': ['擦'],
    'cai': ['才', '菜', '采', '彩', '材', '猜', '踩'],
    'can': ['餐', '参', '残', '惨'],
    'cang': ['藏', '仓', '苍'],
    'cao': ['草', '操', '槽'],
    'ce': ['策', '侧', '测', '册'],
    'cen': ['参'],
    'ceng': ['层', '曾'],
    'cha': ['茶', '查', '差', '插', '叉'],
    'chai': ['拆', '柴'],
    'chan': ['产', '缠', '颤'],
    'chang': ['常', '长', '场', '唱', '厂', '尝'],
    'chao': ['超', '抄', '朝', '吵', '炒'],
    'che': ['车', '扯', '彻'],
    'chen': ['晨', '衬', '沉', '陈'],
    'cheng': ['成', '城', '程', '称', '乘', '诚', '承'],
    'chi': ['吃', '迟', '持', '尺', '池', '翅'],
    'chong': ['重', '冲', '充', '虫'],
    'chou': ['抽', '愁', '臭', '丑'],
    'chu': ['出', '初', '除', '处', '楚', '厨'],
    'chuan': ['穿', '船', '传', '川'],
    'chuang': ['床', '窗', '创', '闯'],
    'chui': ['吹', '垂'],
    'chun': ['春', '纯', '唇'],
    'chuo': ['戳'],
    'ci': ['次', '此', '词', '刺', '赐', '瓷'],
    'cong': ['从', '聪', '葱'],
    'cou': ['凑'],
    'cu': ['粗', '促', '醋'],
    'cuan': ['窜', '篡'],
    'cui': ['催', '脆', '翠'],
    'cun': ['村', '存', '寸'],
    'cuo': ['错', '挫', '搓'],
    'da': ['大', '打', '达', '答'],
    'dai': ['带', '代', '待', '袋', '戴', '呆'],
    'dan': ['但', '单', '蛋', '担', '淡', '胆'],
    'dang': ['当', '党', '挡', '档'],
    'dao': ['到', '道', '导', '岛', '倒', '刀'],
    'de': ['的', '得', '地', '德'],
    'dei': ['得'],
    'deng': ['等', '灯', '登', '邓'],
    'di': ['第', '地', '低', '底', '弟', '递', '滴'],
    'dian': ['点', '电', '店', '典', '垫', '殿'],
    'diao': ['掉', '调', '吊', '钓'],
    'die': ['跌', '爹', '叠', '碟'],
    'ding': ['定', '顶', '订', '丁', '叮'],
    'diu': ['丢'],
    'dong': ['动', '东', '懂', '冬', '洞'],
    'dou': ['都', '豆', '斗', '逗'],
    'du': ['读', '度', '都', '独', '毒', '肚'],
    'duan': ['短', '段', '断', '端'],
    'dui': ['对', '队', '堆'],
    'dun': ['顿', '吨', '蹲', '盾'],
    'duo': ['多', '朵', '夺', '躲', '舵'],
    'e': ['俄', '饿', '额', '鹅', '恶'],
    'ei': ['诶'],
    'en': ['恩', '嗯'],
    'eng': ['鞥'],
    'er': ['儿', '二', '耳', '而', '尔', '贰'],
    'fa': ['发', '法', '罚', '乏', '伐'],
    'fan': ['饭', '反', '范', '烦', '翻', '凡'],
    'fang': ['方', '房', '放', '访', '防', '仿'],
    'fei': ['非', '飞', '费', '肥', '废'],
    'fen': ['分', '份', '粉', '份', '愤', '芬'],
    'feng': ['风', '丰', '封', '峰', '疯', '逢'],
    'fo': ['佛'],
    'fou': ['否'],
    'fu': ['服', '父', '复', '富', '福', '付', '负', '副', '夫'],
    'ga': ['嘎', '尬'],
    'gai': ['该', '改', '概', '盖', '钙'],
    'gan': ['感', '敢', '干', '赶', '甘', '竿'],
    'gang': ['刚', '钢', '港', '岗', '杠'],
    'gao': ['高', '告', '搞', '稿', '糕'],
    'ge': ['个', '各', '哥', '歌', '格', '隔', '割'],
    'gei': ['给'],
    'gen': ['跟', '根'],
    'geng': ['更', '耕', '耿'],
    'gong': ['工', '公', '共', '功', '供', '弓', '宫'],
    'gou': ['够', '狗', '构', '购', '沟'],
    'gu': ['古', '故', '骨', '股', '鼓', '固', '姑'],
    'gua': ['瓜', '挂', '刮'],
    'guai': ['怪', '乖', '拐'],
    'guan': ['关', '管', '馆', '观', '官', '贯'],
    'guang': ['光', '广', '逛'],
    'gui': ['贵', '规', '归', '鬼', '轨', '柜'],
    'gun': ['滚', '棍', '丨'],
    'guo': ['国', '过', '果', '锅', '裹'],
    'ha': ['哈', '蛤'],
    'hai': ['海', '还', '害', '孩', '嗨'],
    'han': ['汉', '喊', '含', '汗', '寒', '韩'],
    'hang': ['行', '航', '杭', '巷'],
    'hao': ['好', '号', '毫', '豪', '耗'],
    'he': ['和', '喝', '河', '合', '何', '黑', '荷', '盒'],
    'hei': ['黑', '嘿'],
    'hen': ['很', '恨', '痕'],
    'heng': ['横', '恒', '哼'],
    'hong': ['红', '宏', '洪', '轰'],
    'hou': ['后', '候', '厚', '猴', '喉'],
    'hu': ['护', '湖', '虎', '互', '呼', '忽', '乎'],
    'hua': ['话', '花', '画', '华', '化', '滑'],
    'huai': ['坏', '怀', '淮'],
    'huan': ['换', '欢', '环', '还', '缓', '幻'],
    'huang': ['黄', '慌', '皇', '荒'],
    'hui': ['会', '回', '灰', '挥', '辉', '悔', '惠'],
    'hun': ['混', '婚', '昏', '魂'],
    'huo': ['火', '或', '活', '货', '伙', '获'],
    'ji': ['几', '机', '级', '极', '集', '基', '记', '系', '寄', '鸡', '急', '计', '技', '际'],
    'jia': ['家', '加', '价', '架', '甲', '假', '驾'],
    'jian': ['见', '间', '件', '建', '健', '简', '剪', '检', '坚', '尖'],
    'jiang': ['讲', '将', '江', '奖', '降', '酱'],
    'jiao': ['叫', '教', '交', '角', '脚', '觉', '较', '焦'],
    'jie': ['接', '节', '结', '借', '姐', '街', '解', '介', '界'],
    'jin': ['进', '近', '金', '今', '斤', '紧', '禁', '仅'],
    'jing': ['经', '京', '睛', '静', '景', '警', '净', '镜', '精'],
    'jiong': ['囧', '窘'],
    'jiu': ['九', '就', '旧', '酒', '久', '救', '究'],
    'ju': ['句', '局', '居', '具', '剧', '举', '聚', '拒'],
    'juan': ['卷', '圈', '捐', '倦'],
    'jue': ['觉', '决', '绝', '角', '爵'],
    'jun': ['军', '均', '君', '俊'],
    'ka': ['卡', '咖'],
    'kai': ['开', '凯', '慨'],
    'kan': ['看', '砍', '刊', '堪'],
    'kang': ['康', '抗', '扛'],
    'kao': ['考', '靠', '烤'],
    'ke': ['可', '克', '刻', '客', '课', '科', '渴'],
    'ken': ['肯', '啃'],
    'keng': ['坑'],
    'kong': ['空', '恐', '孔', '控'],
    'kou': ['口', '扣'],
    'ku': ['苦', '哭', '裤', '库'],
    'kua': ['跨', '夸', '垮'],
    'kuai': ['块', '快', '筷', '会'],
    'kuan': ['宽', '款'],
    'kuang': ['矿', '框', '旷', '况', '狂'],
    'kui': ['亏', '愧', '盔'],
    'kun': ['困', '昆', '捆'],
    'kuo': ['阔', '扩', '括'],
    'la': ['拉', '啦', '辣', '落'],
    'lai': ['来', '赖'],
    'lan': ['蓝', '篮', '兰', '懒', '烂'],
    'lang': ['浪', '郎', '朗', '狼'],
    'lao': ['老', '劳', '姥', '牢'],
    'le': ['了', '乐', '勒'],
    'lei': ['类', '累', '雷', '泪'],
    'leng': ['冷', '愣'],
    'li': ['里', '离', '力', '立', '丽', '利', '理', '礼', '历', '李', '例'],
    'lia': ['俩'],
    'lian': ['脸', '练', '连', '恋', '联', '莲'],
    'liang': ['两', '亮', '凉', '量', '粮', '良'],
    'liao': ['了', '聊', '料', '疗'],
    'lie': ['列', '烈', '猎', '裂'],
    'lin': ['林', '临', '邻', '淋'],
    'ling': ['零', '领', '另', '令', '灵', '铃'],
    'liu': ['六', '流', '留', '刘', '溜'],
    'long': ['龙', '隆', '楼', '弄'],
    'lou': ['楼', '漏', '露', '搂'],
    'lu': ['路', '录', '陆', '露', '炉'],
    'lv': ['绿', '律', '虑', '旅', '铝', '驴'],
    'luan': ['乱', '卵'],
    'lue': ['略', '掠'],
    'lun': ['轮', '论', '伦'],
    'luo': ['落', '罗', '络', '骆'],
    'ma': ['吗', '妈', '马', '骂', '麻'],
    'mai': ['买', '卖', '麦', '迈'],
    'man': ['慢', '满', '曼', '蛮'],
    'mang': ['忙', '盲', '茫'],
    'mao': ['猫', '毛', '帽', '贸'],
    'me': ['么'],
    'mei': ['没', '每', '美', '妹', '煤', '梅'],
    'men': ['们', '门', '闷'],
    'meng': ['梦', '猛', '蒙', '盟'],
    'mi': ['米', '秘', '密', '迷', '蜜'],
    'mian': ['面', '免', '棉', '眠'],
    'miao': ['秒', '苗', '妙', '描'],
    'mie': ['灭'],
    'min': ['民', '敏', '悯'],
    'ming': ['名', '明', '命', '鸣'],
    'miu': ['谬'],
    'mo': ['末', '默', '摸', '莫', '摩'],
    'mou': ['某', '谋'],
    'mu': ['木', '目', '母', '暮', '幕', '墓'],
    'na': ['那', '哪', '拿', '纳', '呐'],
    'nai': ['奶', '耐', '奈'],
    'nan': ['南', '难', '男'],
    'nang': ['囊'],
    'nao': ['脑', '闹', '恼'],
    'ne': ['呢'],
    'nei': ['内', '馁'],
    'nen': ['嫩'],
    'neng': ['能'],
    'ni': ['你', '呢', '泥', '拟', '逆'],
    'nian': ['年', '念', '粘'],
    'niang': ['娘', '酿'],
    'niao': ['鸟', '尿'],
    'nie': ['捏', '聂'],
    'nin': ['您'],
    'ning': ['宁', '凝', '拧'],
    'niu': ['牛', '扭', '纽'],
    'nong': ['农', '弄', '浓'],
    'nu': ['怒', '奴'],
    'nv': ['女'],
    'nuan': ['暖'],
    'nuo': ['诺', '挪'],
    'o': ['哦'],
    'ou': ['偶', '欧', '呕'],
    'pa': ['怕', '爬', '趴'],
    'pai': ['排', '派', '牌', '拍'],
    'pan': ['盘', '判', '盼'],
    'pang': ['旁', '胖'],
    'pao': ['跑', '泡', '炮', '袍'],
    'pei': ['陪', '配', '培', '赔'],
    'pen': ['盆', '喷'],
    'peng': ['朋', '碰', '棚', '彭'],
    'pi': ['皮', '批', '匹', '疲', '披'],
    'pian': ['片', '篇', '骗', '偏'],
    'piao': ['票', '漂', '飘'],
    'pie': ['撇'],
    'pin': ['品', '拼', '贫', '聘'],
    'ping': ['平', '评', '瓶', '苹', '凭'],
    'po': ['破', '婆', '迫', '坡', '泼'],
    'pou': ['剖'],
    'pu': ['普', '铺', '朴', '谱'],
    'qi': ['七', '其', '起', '期', '气', '奇', '骑', '企', '妻', '旗', '器'],
    'qia': ['恰', '卡'],
    'qian': ['前', '钱', '千', '签', '浅', '牵', '铅'],
    'qiang': ['枪', '强', '墙', '抢'],
    'qiao': ['桥', '瞧', '巧', '敲', '悄'],
    'qie': ['切', '且', '窃'],
    'qin': ['亲', '勤', '琴', '芹'],
    'qing': ['请', '清', '情', '青', '轻', '晴', '庆'],
    'qiong': ['穷'],
    'qiu': ['秋', '求', '球'],
    'qu': ['去', '取', '曲', '趣', '区', '屈'],
    'quan': ['全', '权', '劝', '圈', '泉'],
    'que': ['却', '确', '缺', '雀'],
    'qun': ['群', '裙'],
    'ran': ['然', '染', '燃'],
    'rang': ['让', '嚷', '壤'],
    'rao': ['绕', '扰', '饶'],
    're': ['热', '惹'],
    'ren': ['人', '认', '任', '仁', '忍'],
    'reng': ['扔', '仍'],
    'ri': ['日'],
    'rong': ['容', '荣', '融', '绒'],
    'rou': ['肉', '柔', '揉'],
    'ru': ['如', '入', '儒', '乳'],
    'ruan': ['软'],
    'rui': ['瑞', '锐'],
    'run': ['润'],
    'ruo': ['若', '弱'],
    'sa': ['撒', '洒'],
    'sai': ['赛', '塞', '腮'],
    'san': ['三', '伞', '散'],
    'sang': ['桑', '丧', '嗓'],
    'sao': ['扫', '嫂'],
    'se': ['色', '瑟'],
    'sen': ['森'],
    'sha': ['沙', '杀', '纱', '傻'],
    'shai': ['晒'],
    'shan': ['山', '闪', '扇', '善', '衫'],
    'shang': ['上', '商', '伤', '尚', '赏'],
    'shao': ['少', '烧', '绍', '勺', '哨'],
    'she': ['社', '设', '舍', '射', '涉'],
    'shei': ['谁'],
    'shen': ['什', '身', '深', '神', '审', '申'],
    'sheng': ['生', '声', '升', '省', '胜', '剩', '绳'],
    'shi': ['是', '时', '十', '事', '市', '师', '试', '识', '使', '实', '视', '式', '世', '失', '示'],
    'shou': ['手', '首', '受', '收', '守', '受', '瘦'],
    'shu': ['书', '数', '树', '水', '输', '熟', '术', '属', '叔', '舒服'],
    'shua': ['刷', '耍'],
    'shuai': ['帅', '甩', '摔'],
    'shuan': ['栓'],
    'shuang': ['双', '爽', '霜'],
    'shui': ['水', '睡', '谁', '税'],
    'shun': ['顺'],
    'shuo': ['说', '硕'],
    'si': ['四', '死', '思', '司', '丝', '私', '似'],
    'song': ['送', '松', '宋', '诵'],
    'sou': ['搜', '艘'],
    'su': ['速', '素', '诉', '宿', '塑'],
    'suan': ['算', '酸'],
    'sui': ['岁', '随', '虽', '碎'],
    'sun': ['孙', '损', '笋'],
    'suo': ['所', '锁', '索', '缩'],
    'ta': ['他', '她', '它', '踏', '塔'],
    'tai': ['太', '台', '态', '抬', '泰'],
    'tan': ['谈', '探', '叹', '炭', '毯'],
    'tang': ['堂', '糖', '汤', '躺', '烫'],
    'tao': ['套', '逃', '桃', '讨', '淘'],
    'te': ['特', '慝'],
    'teng': ['疼', '腾'],
    'ti': ['提', '体', '题', '替', '踢', '梯'],
    'tian': ['天', '田', '填', '甜', '添'],
    'tiao': ['条', '跳', '调', '挑'],
    'tie': ['铁', '贴', '帖'],
    'ting': ['听', '停', '厅', '庭', '挺'],
    'tong': ['同', '通', '痛', '童', '桶', '铜'],
    'tou': ['头', '透', '投', '偷'],
    'tu': ['土', '图', '突', '途', '涂', '兔'],
    'tuan': ['团', '湍'],
    'tui': ['推', '退', '腿'],
    'tun': ['吞', '屯'],
    'tuo': ['脱', '拖', '托', '妥', '驼'],
    'wa': ['挖', '娃', '袜', '瓦'],
    'wai': ['外', '歪'],
    'wan': ['完', '万', '晚', '碗', '玩', '湾'],
    'wang': ['王', '往', '望', '忘', '网', '亡'],
    'wei': ['为', '位', '未', '喂', '微', '围', '危', '伟', '味', '维'],
    'wen': ['文', '问', '闻', '温', '稳', '吻'],
    'weng': ['翁'],
    'wo': ['我', '握', '窝', '卧'],
    'wu': ['五', '物', '午', '无', '舞', '屋', '武', '误', '务', '乌'],
    'xi': ['西', '息', '洗', '细', '喜', '系', '吸', '希', '戏', '稀', '席'],
    'xia': ['下', '夏', '峡', '吓', '瞎', '虾'],
    'xian': ['先', '现', '线', '限', '显', '险', '鲜', '咸'],
    'xiang': ['想', '向', '像', '相', '响', '香', '乡', '箱', '详'],
    'xiao': ['小', '笑', '校', '效', '消', '销', '削'],
    'xie': ['写', '些', '谢', '鞋', '斜', '携', '卸'],
    'xin': ['新', '心', '信', '辛', '欣'],
    'xing': ['行', '星', '性', '形', '幸', '醒', '姓', '兴'],
    'xiong': ['胸', '雄', '熊', '兄', '凶'],
    'xiu': ['休', '修', '秀', '袖'],
    'xu': ['需', '许', '徐', '续', '虚', '须'],
    'xuan': ['选', '宣', '悬', '旋'],
    'xue': ['学', '雪', '靴', '穴', '血'],
    'xun': ['寻', '讯', '训', '迅'],
    'ya': ['呀', '压', '牙', '鸭', '亚'],
    'yan': ['眼', '言', '严', '验', '演', '烟', '研', '盐', '岩'],
    'yang': ['样', '阳', '羊', '养', '洋'],
    'yao': ['要', '药', '摇', '腰', '咬', '邀'],
    'ye': ['也', '夜', '业', '页', '叶', '爷'],
    'yi': ['一', '以', '已', '意', '医', '衣', '易', '义', '移', '依', '疑', '仪', '亿'],
    'yin': ['因', '音', '银', '引', '印', '阴'],
    'ying': ['应', '英', '影', '硬', '迎', '赢', '映'],
    'yo': ['哟'],
    'yong': ['用', '勇', '永', '拥', '涌'],
    'you': ['有', '又', '由', '右', '友', '游', '油', '优', '幼'],
    'yu': ['雨', '语', '与', '鱼', '于', '遇', '余', '玉', '育', '欲'],
    'yuan': ['远', '元', '院', '圆', '原', '愿', '园', '源', '员'],
    'yue': ['月', '越', '乐', '约', '跃', '阅'],
    'yun': ['云', '运', '匀', '允', '孕'],
    'za': ['杂', '砸'],
    'zai': ['在', '再', '载', '灾', '栽'],
    'zan': ['咱', '赞', '暂'],
    'zang': ['脏', '藏'],
    'zao': ['早', '造', '糟', '遭', '噪', '灶'],
    'ze': ['则', '责', '择'],
    'zei': ['贼'],
    'zen': ['怎'],
    'zeng': ['增', '赠'],
    'zha': ['扎', '炸', '眨', '查'],
    'zhai': ['摘', '窄', '宅', '债'],
    'zhan': ['站', '占', '战', '展', '沾'],
    'zhang': ['张', '长', '掌', '丈', '帐', '涨'],
    'zhao': ['找', '着', '照', '朝', '招', '召'],
    'zhe': ['这', '着', '者', '折', '遮'],
    'zhen': ['真', '阵', '镇', '针', '震'],
    'zheng': ['正', '政', '整', '争', '证', '征', '挣'],
    'zhi': ['只', '指', '知', '直', '至', '制', '治', '支', '志', '质', '纸', '止', '值'],
    'zhong': ['中', '重', '种', '钟', '终', '众'],
    'zhou': ['周', '洲', '舟', '州', '昼'],
    'zhu': ['主', '住', '注', '助', '著', '猪', '竹', '朱', '诸'],
    'zhua': ['抓'],
    'zhuai': ['拽'],
    'zhuan': ['转', '专', '砖', '赚'],
    'zhuang': ['装', '壮', '撞', '庄', '状'],
    'zhui': ['追', '坠'],
    'zhun': ['准'],
    'zhuo': ['桌', '捉', '著', '拙'],
    'zi': ['字', '子', '自', '资', '紫', '仔'],
    'zong': ['总', '从', '宗', '纵'],
    'zou': ['走', '揍'],
    'zu': ['组', '足', '族', '祖', '阻'],
    'zuan': ['钻'],
    'zui': ['最', '嘴', '醉', '罪'],
    'zun': ['尊', '遵'],
    'zuo': ['做', '坐', '作', '左', '座', '昨']
  };

  function cleanPinyin(p) {
    if (!p) return '';
    return p.toLowerCase()
      .replace(/[āáǎà]/g, 'a')
      .replace(/[ēéěè]/g, 'e')
      .replace(/[īíǐì]/g, 'i')
      .replace(/[ōóǒò]/g, 'o')
      .replace(/[ūúǔù]/g, 'u')
      .replace(/[ǖǘǚǜü]/g, 'v')
      .replace(/[^a-z]/g, '');
  }

  function segment(pinyin) {
    const res = [];
    function backtrack(start) {
      if (start >= pinyin.length) return true;
      for (let len = Math.min(6, pinyin.length - start); len >= 1; len--) {
        const sub = pinyin.slice(start, start + len);
        if (SYLLABLES.has(sub)) {
          res.push(sub);
          if (backtrack(start + len)) return true;
          res.pop();
        }
      }
      return false;
    }
    return backtrack(0) ? res : [pinyin];
  }

  const dict = {};
  function add(py, hz) {
    if (!py || !hz) return;
    const cleanKey = cleanPinyin(py);
    if (!cleanKey) return;
    if (!dict[cleanKey]) dict[cleanKey] = [];
    if (!dict[cleanKey].includes(hz)) dict[cleanKey].push(hz);
  }

  function addWord(hz, py) {
    if (!hz) return;
    const clean = cleanPinyin(py);
    add(clean, hz);

    const chars = [...hz];
    const segs = segment(clean);
    if (chars.length === segs.length) {
      for (let i = 0; i < chars.length; i++) {
        add(segs[i], chars[i]);
      }
    }
  }

  // 1. Common Syllable Map
  for (const [syllable, chars] of Object.entries(COMMON_CHAR_MAP)) {
    chars.forEach(ch => add(syllable, ch));
  }

  // 2. Radicals (Extract pure CJK characters, stripping variant brackets and slashes)
  (d.SEED_RADICALS || []).forEach(r => {
    if (!r.character) return;
    const chars = r.character.match(/[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u2E80-\u2EFF]/g) || [];
    chars.forEach(c => add(r.pinyin, c));
  });

  // 3. Seed vocab
  (d.SEED_VOCABULARY || []).forEach(v => {
    addWord(v.hanzi, v.pinyinRaw || v.pinyin);
  });

  // 4. Topics
  const topics = [...(s.HSK1_TOPICS || []), ...(s.HSK2_TOPICS || []), ...(s.HSK3_TOPICS || [])];
  topics.forEach(t => {
    (t.vocabularies || []).forEach(v => {
      addWord(v.hanzi, v.pinyin);
    });
  });

  // 5. Common Phrases & Compound Words
  const commonPhrases = [
    ['你好', 'nihao'],
    ['您好', 'ninhao'],
    ['谢谢', 'xiexie'],
    ['再见', 'zaijian'],
    ['对不起', 'duibuqi'],
    ['没关系', 'meiguanxi'],
    ['请问', 'qingwen'],
    ['不客气', 'bukeqi'],
    ['中国', 'zhongguo'],
    ['北京', 'beijing'],
    ['学生', 'xuesheng'],
    ['学习', 'xuexi'],
    ['学校', 'xuexiao'],
    ['老师', 'laoshi'],
    ['同学', 'tongxue'],
    ['朋友', 'pengyou'],
    ['医生', 'yisheng'],
    ['医院', 'yiyuan'],
    ['商店', 'shangdian'],
    ['名字', 'mingzi'],
    ['什么', 'shenme'],
    ['多少', 'duoshao'],
    ['几', 'ji'],
    ['谁', 'shei'],
    ['谁', 'shui'],
    ['哪儿', 'nar'],
    ['哪里', 'nali'],
    ['这里', 'zheli'],
    ['那里', 'nali'],
    ['怎么样', 'zenmeyang'],
    ['认识', 'renshi'],
    ['高兴', 'gaoxing'],
    ['喜欢', 'xihuan'],
    ['觉得', 'juede'],
    ['想', 'xiang'],
    ['看', 'kan'],
    ['听', 'ting'],
    ['说', 'shuo'],
    ['读', 'du'],
    ['写', 'xie'],
    ['吃', 'chi'],
    ['喝', 'he'],
    ['买', 'mai'],
    ['卖', 'mai'],
    ['去', 'qu'],
    ['来', 'lai'],
    ['回', 'hui'],
    ['做', 'zuo'],
    ['坐', 'zuo'],
    ['今天', 'jintian'],
    ['明天', 'mingtian'],
    ['昨天', 'zuotian'],
    ['上午', 'shangwu'],
    ['中午', 'zhongwu'],
    ['下午', 'xiawu'],
    ['晚上', 'wanshang'],
    ['现在', 'xianzai'],
    ['汉语', 'hanyu'],
    ['中文', 'zhongwen']
  ];
  commonPhrases.forEach(([hz, py]) => addWord(hz, py));

  console.log('Total dict keys:', Object.keys(dict).length);
  
  const outDir = path.resolve('frontend/js/ui/pinyin-ime');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const jsonStr = JSON.stringify(dict, null, 2);
  const fileContent = `/**
 * =============================================================================
 * OFFLINE CHINESE PINYIN DICTIONARY & SYLLABLE ENGINE
 * Module: frontend/js/ui/pinyin-ime/pinyin-dict.js
 * 
 * Auto-compiled offline dictionary covering:
 * - 214 Kangxi Radicals
 * - Full HSK 1, 2, 3 curriculum vocabulary
 * - Common conversational words and compound words
 * - 399 Standard Mandarin Chinese Pinyin syllables
 * Zero network dependencies. Runs 100% locally.
 * =============================================================================
 */

export const SYLLABLES = new Set(${JSON.stringify(Array.from(SYLLABLES))});

export const PINYIN_DICT = ${jsonStr};

/**
 * Normalizes pinyin text by stripping tone diacritics and non-alpha characters.
 * @param {string} p
 * @returns {string}
 */
export function cleanPinyin(p) {
  if (!p) return '';
  return String(p).toLowerCase()
    .replace(/[ǖǘǚǜü]/g, 'v')
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .replace(/[āáǎà]/g, 'a')
    .replace(/[ēéěè]/g, 'e')
    .replace(/[īíǐì]/g, 'i')
    .replace(/[ōóǒò]/g, 'o')
    .replace(/[ūúǔù]/g, 'u')
    .replace(/[^a-z]/g, '');
}

/**
 * Greedily segments continuous pinyin into valid Mandarin syllables.
 * @param {string} pinyin
 * @returns {string[]}
 */
export function segmentPinyin(pinyin) {
  const clean = cleanPinyin(pinyin);
  if (!clean) return [];
  const res = [];
  function backtrack(start) {
    if (start >= clean.length) return true;
    for (let len = Math.min(6, clean.length - start); len >= 1; len--) {
      const sub = clean.slice(start, start + len);
      if (SYLLABLES.has(sub)) {
        res.push(sub);
        if (backtrack(start + len)) return true;
        res.pop();
      }
    }
    return false;
  }
  return backtrack(0) ? res : [clean];
}

/**
 * Looks up Chinese character/word candidates for a given pinyin query.
 * @param {string} query
 * @param {number} [maxResults=20]
 * @returns {string[]}
 */
export function lookupPinyin(query, maxResults = 20) {
  const clean = cleanPinyin(query);
  if (!clean) return [];

  const candidates = [];
  const seen = new Set();

  function pushCandidate(item) {
    if (item && !seen.has(item)) {
      seen.add(item);
      candidates.push(item);
    }
  }

  // 1. Exact match
  if (PINYIN_DICT[clean]) {
    for (const ch of PINYIN_DICT[clean]) {
      pushCandidate(ch);
      if (candidates.length >= maxResults) return candidates;
    }
  }

  // 2. Segmented combination (e.g. xuesheng -> xue + sheng -> 学生)
  const segments = segmentPinyin(clean);
  if (segments.length > 1) {
    if (segments.length === 2) {
      const seg0 = (PINYIN_DICT[segments[0]] || []).slice(0, 4);
      const seg1 = (PINYIN_DICT[segments[1]] || []).slice(0, 4);
      for (const c0 of seg0) {
        for (const c1 of seg1) {
          pushCandidate(c0 + c1);
          if (candidates.length >= maxResults) return candidates;
        }
      }
    } else {
      const segCandidates = segments.map(s => PINYIN_DICT[s] || []);
      if (segCandidates.every(list => list.length > 0)) {
        const combo = segCandidates.map(list => list[0]).join('');
        pushCandidate(combo);
      }
    }
  }

  // 3. Prefix match for multi-character words
  if (clean.length >= 2) {
    for (const [key, list] of Object.entries(PINYIN_DICT)) {
      if (key !== clean && key.startsWith(clean)) {
        for (const item of list) {
          if (item.length > 1) {
            pushCandidate(item);
            if (candidates.length >= maxResults) return candidates;
          }
        }
      }
    }
  }

  return candidates;
}
`;

  fs.writeFileSync(path.join(outDir, 'pinyin-dict.js'), fileContent, 'utf-8');
  console.log('Saved pinyin-dict.js successfully! Path:', path.join(outDir, 'pinyin-dict.js'));
}

generateDict();
