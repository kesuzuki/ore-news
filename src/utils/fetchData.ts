export interface Article {
  unixTime: number;
  dateTime: string;
  title: string;
  baseTitle: string;
  series: number;
  submitter: string;
  commentCount: number;
  momentum: number;
}

export async function fetchAndParseData(): Promise<Article[]> {
  const url = import.meta.env.SOURCE_URL || 'https://asahi.5ch.io/newsplus/subject.txt';
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  
  // Shift_JIS でデコード
  const decoder = new TextDecoder('shift-jis');
  const text = decoder.decode(arrayBuffer);
  
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
  const articles: Article[] = [];
  const nowUnix = Math.floor(Date.now() / 1000);

  for (const line of lines) {
    const matchLine = line.match(/^(\d+)\.dat<>(.*)$/);
    if (!matchLine) continue;
    
    const unixTimeStr = matchLine[1];
    // 1行目と2行目は先頭が「9」から始まるので無視。
    if (unixTimeStr.startsWith('9')) continue;
    const unixTime = parseInt(unixTimeStr, 10);
    
    let rawTitle = matchLine[2];
    
    // コメント数を取り出す 例： (18)
    const commentMatch = rawTitle.match(/\s*\((\d+)\)$/);
    if (!commentMatch) continue;
    const commentCount = parseInt(commentMatch[1], 10);
    
    // コメント数が50未満の場合は無視
    if (commentCount < 50) continue; 
    
    rawTitle = rawTitle.replace(/\s*\(\d+\)$/, ''); // コメント数を削除
    
    // 投稿者を抽出 例： [ぐれ★]
    let submitter = '';
    const submitterMatch = rawTitle.match(/\s*\[([^\]]+)\]$/);
    if (submitterMatch) {
      submitter = submitterMatch[1];
      rawTitle = rawTitle.replace(/\s*\[[^\]]+\]$/, ''); // 投稿者を削除
    }
    
    // シリーズとベースタイトル抽出
    let series = 1;
    let baseTitle = rawTitle;
    const seriesMatch = rawTitle.match(/(.*?)\s*★(\d+)\s*$/);
    if (seriesMatch) {
      baseTitle = seriesMatch[1];
      series = parseInt(seriesMatch[2], 10);
    } else {
      // ★の後に数字がないケースは無視する
      if (rawTitle.match(/★\s*$/)) continue;
    }
    
    // YYYY-MM-DD hh:mm:ss (JST前提)
    const d = new Date(unixTime * 1000 + 9 * 3600 * 1000);
    const dateTime = d.toISOString().replace('T', ' ').substring(0, 19);
    
    // 勢い（24時間あたりのコメント数）の計算
    const elapsedHours = (nowUnix - unixTime) / 3600;
    const momentum = (commentCount / Math.max(elapsedHours, 0.0001)) * 24;
    
    articles.push({
      unixTime,
      dateTime,
      title: rawTitle.trim(),
      baseTitle: baseTitle.trim(),
      series,
      submitter,
      commentCount,
      momentum: Math.round(momentum)
    });
  }
  
  // ベースタイトルでグループ化し、最大の勢いをもつものを残す
  const groupMap = new Map<string, Article>();
  for (const article of articles) {
    const existing = groupMap.get(article.baseTitle);
    if (!existing || existing.momentum < article.momentum) {
      groupMap.set(article.baseTitle, article);
    }
  }
  
  // 勢いの降順にソート
  const sortedArticles = Array.from(groupMap.values()).sort((a, b) => b.momentum - a.momentum);
  
  // 上位20件を返す
  return sortedArticles.slice(0, 20);
}
