import type { Category } from '../../types'

export function buildPrompt(input: string, categories: Category[], today: string): string {
  const categoryList = categories
    .filter((c) => c.budgetable)
    .map((c) => c.name)
    .join('、')

  return `当前日期：${today}

你是一个消费记录解析助手。请将用户的自然语言输入解析为结构化的消费记录。

分类仅限以下选项：${categoryList}、收入

分类关键词映射：
- 餐饮：早餐、午饭、晚饭、外卖、食堂、奶茶、咖啡、零食、水果、饮料、面包
- 交通：地铁、公交、打车、滴滴、共享单车、高铁、机票、加油、停车
- 学习：书、课程、会员、教程、考试、资料、付费知识、网课、文具
- 娱乐：电影、游戏、聚会、KTV、视频会员、音乐、旅游、景点、桌游
- 健身：健身房、游泳、运动装备、私教、瑜伽、羽毛球、球拍
- 日用品：纸巾、洗发水、牙膏、洗衣液、生活用品、收纳、家居
- 恋爱/社交：约会、礼物、请客、聚餐、红包、鲜花
- 收入：工资、兼职、退款、红包收入、理财、奖金、补贴
- 其他：无法判断的消费

日期规则：
- 无日期默认为当天
- 支持"今天"、"昨天"、"前天"、"6月9日"、"2026-06-09"格式
- 复杂相对日期（上周五、上个月）识别失败时默认为当天

金额必须为正数。
如果用户输入中没有明确包含金额的消费或收入记录，请返回空数组 []。

用户输入：${input}

请只返回 JSON 数组，不包含任何其他文字。格式如下：
[{"title":"消费名称","amount":金额数字,"categoryName":"分类名称","type":"expense或income","date":"YYYY-MM-DD","confidence":0-1之间的数字}]`
}
