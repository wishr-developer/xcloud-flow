import type { BusinessType } from "@/lib/types";

export interface BusinessTemplate {
  id: BusinessType;
  displayName: string;
  serviceLabel: string;
  instructorLabel: string;
  participantLabel: string;
  scheduleLabel: string;
  heroCopy: string;
  chatOpeningMessage: string;
  sampleCategories: string[];
  examplePrompts: string[];
}

const TEMPLATES: Record<BusinessType, BusinessTemplate> = {
  multi: {
    id: "multi",
    displayName: "汎用 (マルチ業態)",
    serviceLabel: "レッスン",
    instructorLabel: "講師",
    participantLabel: "受講者",
    scheduleLabel: "予約枠",
    heroCopy:
      "あらゆるスクール業態のためのオールインワンSaaS。予約・受講・決済・通知をひとつに。",
    chatOpeningMessage:
      "こんにちは！ご希望のレッスンと日時を教えてください。空き枠をご案内します。",
    sampleCategories: ["体験", "通常", "プレミアム", "オンライン"],
    examplePrompts: [
      "今週空いてるレッスンを教えて",
      "初心者向けはありますか？",
      "土日にオンラインで受けたい",
    ],
  },
  learning: {
    id: "learning",
    displayName: "学習塾 / 教育",
    serviceLabel: "講座",
    instructorLabel: "講師",
    participantLabel: "生徒",
    scheduleLabel: "授業日程",
    heroCopy:
      "個別指導・集団授業・オンライン補習まで。学習塾の生徒管理と予約をひとつに。",
    chatOpeningMessage:
      "こんにちは！学びたい科目とご都合の良い時間帯を教えてください。",
    sampleCategories: ["小学生", "中学生", "高校生", "大人向け"],
    examplePrompts: [
      "中学2年の数学を見てほしい",
      "土曜の英語の体験ありますか？",
      "大人の学び直し講座ある？",
    ],
  },
  sports: {
    id: "sports",
    displayName: "スポーツスクール",
    serviceLabel: "クラス",
    instructorLabel: "コーチ",
    participantLabel: "会員",
    scheduleLabel: "練習枠",
    heroCopy:
      "クラブ運営、月謝管理、出席・大会管理まで。あらゆるスポーツスクール向けに。",
    chatOpeningMessage:
      "ようこそ！スポーツクラスの体験予約を承ります。種目と希望日時を教えてください。",
    sampleCategories: ["体験会", "ジュニア", "一般", "選手育成"],
    examplePrompts: [
      "土曜の午後にスポーツクラスありますか？",
      "子ども向けの体験会は？",
      "初心者でも大丈夫？",
    ],
  },
  cooking: {
    id: "cooking",
    displayName: "料理教室",
    serviceLabel: "レッスン",
    instructorLabel: "先生",
    participantLabel: "参加者",
    scheduleLabel: "開催日",
    heroCopy: "料理教室の予約、食材費込みの決済、レシピ共有までまるごと。",
    chatOpeningMessage:
      "ようこそ！料理教室の予約を承ります。学びたいジャンルと日時を教えてください。",
    sampleCategories: ["和食", "洋食", "中華", "パン・お菓子"],
    examplePrompts: [
      "初心者向け料理教室ありますか？",
      "週末に開催されているクラスは？",
      "親子で参加できる？",
    ],
  },
  music: {
    id: "music",
    displayName: "音楽教室",
    serviceLabel: "レッスン",
    instructorLabel: "講師",
    participantLabel: "生徒",
    scheduleLabel: "レッスン枠",
    heroCopy: "音楽教室の予約・月謝・発表会管理まで。先生と生徒のための運営OS。",
    chatOpeningMessage:
      "こんにちは！音楽レッスンの体験予約を承ります。楽器と希望日時を教えてください。",
    sampleCategories: ["ピアノ", "ボーカル", "ギター", "ドラム"],
    examplePrompts: [
      "ピアノの体験レッスンを予約したい",
      "大人初心者でも大丈夫？",
      "オンラインレッスンありますか？",
    ],
  },
  language: {
    id: "language",
    displayName: "語学教室",
    serviceLabel: "レッスン",
    instructorLabel: "講師",
    participantLabel: "受講者",
    scheduleLabel: "レッスン枠",
    heroCopy: "オンライン / 対面、マンツーマンまで。語学スクール運営の決定版。",
    chatOpeningMessage:
      "Hello! 語学レッスンの予約を承ります。レベルと希望の曜日・時間をお知らせください。",
    sampleCategories: ["英会話", "ビジネス英語", "中国語", "韓国語"],
    examplePrompts: [
      "TOEIC対策レッスンありますか？",
      "平日夜オンラインで受けたい",
      "初心者向け英会話を予約したい",
    ],
  },
  dance: {
    id: "dance",
    displayName: "ダンス",
    serviceLabel: "レッスン",
    instructorLabel: "インストラクター",
    participantLabel: "メンバー",
    scheduleLabel: "スタジオ枠",
    heroCopy: "ダンススタジオの予約・チケット制・発表会まで。",
    chatOpeningMessage:
      "ようこそ！ダンスレッスンの予約を承ります。ジャンルと希望日時を教えてください。",
    sampleCategories: ["HIPHOP", "JAZZ", "K-POP", "キッズ"],
    examplePrompts: [
      "初心者向けHIPHOPは？",
      "土日のキッズクラスは？",
      "チケット制ありますか？",
    ],
  },
  yoga: {
    id: "yoga",
    displayName: "ヨガ",
    serviceLabel: "クラス",
    instructorLabel: "インストラクター",
    participantLabel: "会員",
    scheduleLabel: "クラス枠",
    heroCopy: "ヨガスタジオのクラス予約、回数券、オンライン配信に対応。",
    chatOpeningMessage:
      "ようこそ！ヨガクラスのご予約ですね。初心者向け / 経験者向け、ご希望の時間帯を教えてください。",
    sampleCategories: ["ハタヨガ", "陰ヨガ", "パワーヨガ", "オンライン"],
    examplePrompts: [
      "朝ヨガの予約をしたい",
      "初心者向けのクラスは？",
      "オンラインで受けられる？",
    ],
  },
  fitness: {
    id: "fitness",
    displayName: "フィットネス",
    serviceLabel: "セッション",
    instructorLabel: "トレーナー",
    participantLabel: "会員",
    scheduleLabel: "予約枠",
    heroCopy:
      "パーソナル・グループ・オンライン。フィットネス事業の予約と決済を一括管理。",
    chatOpeningMessage:
      "ようこそ！フィットネスセッションの予約を承ります。希望種目と時間帯を教えてください。",
    sampleCategories: ["パーソナル", "グループ", "オンライン", "体験"],
    examplePrompts: [
      "パーソナルトレーニングの体験を予約",
      "夜のグループレッスンは？",
      "ダイエット向けセッション？",
    ],
  },
  art: {
    id: "art",
    displayName: "アート",
    serviceLabel: "ワークショップ",
    instructorLabel: "アーティスト",
    participantLabel: "参加者",
    scheduleLabel: "開催枠",
    heroCopy: "アート教室・ワークショップ運営に。材料費込み決済も対応。",
    chatOpeningMessage:
      "ようこそ！アートクラスの予約を承ります。挑戦したい技法と日時を教えてください。",
    sampleCategories: ["水彩", "油彩", "陶芸", "クラフト"],
    examplePrompts: [
      "初心者向け水彩画ワークショップは？",
      "週末に陶芸を体験したい",
      "親子で参加できるアートクラス？",
    ],
  },
  business: {
    id: "business",
    displayName: "ビジネス研修 / 資格スクール",
    serviceLabel: "研修",
    instructorLabel: "講師",
    participantLabel: "受講者",
    scheduleLabel: "開催日",
    heroCopy:
      "法人研修・資格対策・キャリアスクールの運営に。受講証・修了証発行にも対応。",
    chatOpeningMessage:
      "ようこそ。ビジネス研修のご予約を承ります。テーマとご希望日時をお知らせください。",
    sampleCategories: ["新人研修", "マネジメント", "資格対策", "DX"],
    examplePrompts: [
      "簿記2級の対策講座は？",
      "オンラインのDX研修ありますか？",
      "法人向けの研修プログラムは？",
    ],
  },
  other: {
    id: "other",
    displayName: "その他",
    serviceLabel: "プログラム",
    instructorLabel: "担当者",
    participantLabel: "参加者",
    scheduleLabel: "開催枠",
    heroCopy: "業種を問わない予約・受講・決済プラットフォーム。",
    chatOpeningMessage:
      "こんにちは！ご希望の予約内容と日時を教えてください。",
    sampleCategories: ["体験", "通常", "プレミアム"],
    examplePrompts: [
      "予約状況を教えて",
      "今週の空きは？",
      "オンラインで受けたい",
    ],
  },
};

export function getBusinessTemplate(
  type: BusinessType | string | null | undefined
): BusinessTemplate {
  if (!type) return TEMPLATES.multi;
  return (TEMPLATES as Record<string, BusinessTemplate>)[type] ?? TEMPLATES.multi;
}

export function listBusinessTemplates(): BusinessTemplate[] {
  return Object.values(TEMPLATES);
}

export const ALL_BUSINESS_TYPES = Object.keys(TEMPLATES) as BusinessType[];
