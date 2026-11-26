// Reviewed against Chinese-teaching.txt. These labels are not new translations.
export const correctedTerms = {
  蛰: '惊蛰', 非常道: '道可道，非常道',
  按图索骥原: '按图索骥', 自以为: '自以为是', 怕引来河东狮吼: '河东狮吼',
  射一箭而中两雕: '一箭双雕', 最终只能徒劳无功: '螳臂挡车',
  共同面对未来的一切挑战: '永结同心', 上知府龙王图书: '欢欣鼓舞',
  永远属于你: '杜鹃花', 完美建筑: '泰姬玛哈陵', 结合: '瑜珈',
  水果之王: '榴槤', 鸽子通常: '鸽子', 你曾经去过游轮旅行吗: '游轮',
  在我的心头荡漾: '徐志摩', 观景台分: '台北101', 一日美人: '金针花',
  無人知是荔枝來: '荔枝', 国球: '棒球', 天灯又: '天灯',
  阳明山号称: '陽明山', 或是你也可: '语言交换', 床前明月光: '靜夜思', 鳥: '鳥居',
};

// Ambiguous conversion (e.g. 發/髮) is never used as an automatic merge rule.
// Only attested equivalences are consolidated. The first form is canonical.
export const variantGroups = [
  ['一帆風順', '一帆风顺'], ['團圓', '团圆'], ['莊子', '庄子'],
  ['畢恭畢敬', '毕恭毕敬'], ['画饼充飢', '画饼充饥'], ['端午節', '端午节'],
  ['難兄難弟', '难兄难弟'], ['風調雨順', '风调雨顺'],
];

export const excludedTerms = {
  先跟大家说声新年快乐: '社群休假公告，沒有獨立詞語教學',
  你不: '勞動節社群祝福，被截斷為句子片段',
  学习中文的路上: '個人學習心得，沒有獨立詞語解說',
  雖然還有很大的進步空間啦: '鋼琴練習近況，沒有獨立詞語教學',
  我喜欢骑着脚踏车: '個人生活敘事，不是獨立詞目',
  好书推荐: '書籍宣傳，不是獨立詞語教學',
  旺卡裡的台詞說: '電影台詞與新年祝福，不是獨立詞目',
  心情不好的時候: '生活近況句子，不是獨立詞目',
  人追蹤了: '社群追蹤里程碑公告，詞目不完整',
  无论学生们的学习目标: '教師自我介紹，被截斷為句子片段',
  还未如愿见着不朽: '歌詞摘錄，缺乏獨立教學解說',
  答案会在今天晚上公佈喔: '混合書籍推薦與謎語公告，需人工拆分後再索引',
  现代人讲求饮食健康与追求: '飲食生活句子，被截斷為詞目，需人工補充標題',
};

const sentencePrefix = /^(?:歡迎追蹤|欢迎关注|歡迎關注|追蹤人數|追踪人数|但是|所以|因此|然後|然后|先跟大家|我喜欢|我喜歡|你曾经|你曾經|无论学生|無論學生|或是你|答案会|答案會|心情不好|雖然還有)/u;
export function indexingReason({ term, legacyTerm, providedContent, baseSearchableText }) {
  if (excludedTerms[legacyTerm]) return excludedTerms[legacyTerm];
  if (sentencePrefix.test(term)) return '疑似敘事句子，等待人工審核';
  const description = providedContent.zh.description;
  if ([...description.matchAll(/\p{Script=Han}/gu)].length < 12) return '缺乏足夠的原始中文教學內容';
  const normalized = (value) => value.replace(/\s+/gu, '');
  if (!normalized(baseSearchableText).includes(normalized(term))) return '候選詞目未出現在原始資料';
  return '';
}

export function consolidateEntries(records) {
  const accepted = records.filter((entry) => entry.indexable);
  const groups = new Map();
  for (const entry of accepted) {
    const variants = variantGroups.find((group) => group.includes(entry.term));
    const key = variants?.[0] || entry.term;
    const group = groups.get(key) || [];
    group.push(entry);
    groups.set(key, group);
  }
  return [...groups.entries()].map(([canonicalTerm, members]) => {
    const chosen = members.find((entry) => entry.term === canonicalTerm) || members[0];
    const aliases = [...new Set(members.flatMap((entry) => [entry.term, entry.legacyTerm]))].filter((term) => term !== canonicalTerm);
    return {
      ...chosen, term: canonicalTerm, canonicalTerm, aliases,
      editable: { ...chosen.editable, term: canonicalTerm },
      // Preserve the searchable original explanations and existing query behavior.
      searchableText: [...new Set(members.map((entry) => entry.searchableText)), canonicalTerm, ...aliases].join(' '),
    };
  });
}
