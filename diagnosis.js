// 자동 진단 로직.
// 각 문항의 의도를 문제 유형으로 미리 매핑해두고, 응답 분포가 임계치를 넘으면
// 유형을 판정하고 준비된 개선책을 제시한다. 임계치·개선책은 이 파일에서만 수정한다.
//
// 판정 기준 (freq 문항: 없었다/1~2회/여러 번):
//   발생률 = "있었다"(1회 이상) 응답 비율, 반복률 = "여러 번" 응답 비율
//   심각: 반복률 30%↑ 또는 발생률 50%↑ / 주의: 발생률 20%↑ / 양호: 그 미만
// 판정 기준 (likert 문항, 긍정문): 부정률 = (전혀 아니다+아니다) 비율
//   심각: 부정률 40%↑ / 주의: 20%↑ / 양호: 그 미만
// 유형에 문항이 여러 개면 가장 나쁜 문항 기준으로 판정한다.

const PROBLEM_TYPES = [
  {
    id: 'documentation',
    name: '서면화·기록 부재',
    questionIds: ['a1'],
    why: '지시·요구가 구두로만 오가면 책임 소재가 흐려지고, 협력사는 나중에 말이 바뀌는 위험을 혼자 진다.',
    actions: [
      '요구사항은 일정·수량·기준을 명시해 문서 또는 시스템으로 전달하는 것을 원칙화',
      '구두·메신저로 전달된 요구는 24시간 내 서면 확인을 따라 붙이는 규칙 도입',
      '이관·발주 등 반복 업무는 웹 프로세스(단계별 일정 확인 구조)로 일원화',
    ],
  },
  {
    id: 'unilateral',
    name: '일방적 변경·촉박한 통보',
    questionIds: ['a2', 'a5'],
    why: '합의된 조건을 협의 없이 바꾸거나 당일 호출하는 것은 협력사 계획을 무너뜨리는 대표적 갑질 유형이다.',
    actions: [
      '일정·수량·사양 변경 시 최소 리드타임(예: D-3) 규칙을 정하고 예외는 사유와 함께 기록',
      '방문·회의 요청은 목적과 준비물을 사전 고지하는 것을 기본으로',
      '변경 이력을 시스템에 남겨 "누가 언제 바꿨는지"를 양쪽이 같은 화면으로 확인',
    ],
  },
  {
    id: 'cost-shift',
    name: '비용·부담 전가',
    questionIds: ['a3', 'a4'],
    why: '무리한 납기·수량, 범위 밖 업무 요구는 하도급 분쟁의 핵심 유형이며 법적 리스크로 직결된다.',
    actions: [
      '발주 범위를 계약·발주서에 명확히 하고, 범위 밖 요구는 별도 정산 협의를 거치도록 절차화',
      '긴급 대응으로 발생한 협력사 추가 비용의 분담 기준을 사전에 합의',
      '반복되는 긴급 요구는 원인(우리 쪽 계획 정확도)을 먼저 점검',
    ],
  },
  {
    id: 'no-response',
    name: '응답·후속조치 부재',
    questionIds: ['a6', 'b2'],
    why: '문의가 흐지부지되고 해결 책임자가 없으면, 협력사는 어디에 말해도 소용없다고 학습한다.',
    actions: [
      '협력사 문의·요청에 응답 기한(예: 영업일 2일)을 정하고 접수-처리 상태를 기록',
      '사안별로 해결까지 책임지는 담당자를 지정하고 협력사에 이름을 공지',
      '미해결 건은 주간 단위로 경영진에 보고되는 리스트로 관리',
    ],
  },
  {
    id: 'channel-confusion',
    name: '창구·지시 혼선',
    questionIds: ['a7', 'b1'],
    why: '여러 사람이 서로 다른 지시를 내리면 협력사는 누구 말을 들어야 할지 모르고, 잘못되면 책임만 진다.',
    actions: [
      '업무별 담당 창구를 문서로 정리해 전 협력사에 공지 (담당자 변경 시 즉시 갱신)',
      '협력사에 나가는 요구는 창구 담당자를 거치도록 내부 규칙화',
      '부서 간 상충 요구가 확인되면 협력사가 아니라 내부에서 먼저 정리 후 전달',
    ],
  },
  {
    id: 'blame-shift',
    name: '책임 전가·일방적 판정',
    questionIds: ['a8'],
    why: '원인 검토 없이 협력사 책임으로 규정하면, 실제 원인이 우리 쪽에 있어도 영원히 드러나지 않는다.',
    actions: [
      '품질·납기 문제 발생 시 판정 전 원인 조사를 거치는 절차를 명문화 (조사 전 책임 통보 금지)',
      '원인이 우리 쪽으로 확인된 건은 인정하고 조치 내용을 협력사에 회신',
    ],
  },
  {
    id: 'disrespect',
    name: '고압적 태도·인격적 대우',
    questionIds: ['a9'],
    why: '언행 문제는 한 명이어도 회사 전체의 평판이 되고, 협력사 불만이 대표에게 직접 쌓이는 유형이다.',
    actions: [
      '협력사 응대 행동 기준(반말·언성 금지 등)을 명문화하고 전 접점 인원에 공지',
      '위반이 확인되면 개인 피드백으로 처리 (전체 훈시로 물타기 금지)',
      '재발 시 해당 인원의 협력사 접점 업무 배제까지 포함해 단계적 조치',
    ],
  },
  {
    id: 'silence',
    name: '침묵·불이익 우려',
    questionIds: ['a10'],
    why: '이 유형은 다른 모든 문제의 증폭기다. 말해봤자 불이익이라는 인식이 있으면 문제가 곪을 때까지 아무도 말하지 않는다.',
    actions: [
      '무기명 설문을 반기 1회 정례화하고, 매회 "지난 지적 → 조치한 것"을 함께 공지',
      '불만 제기 협력사에 불이익이 없었다는 사례를 실적으로 축적·공유',
      '이의 제기 공식 채널(시스템 내 이슈 등록 등)을 만들어 개인 간 관계에 의존하지 않게 함',
    ],
  },
  {
    id: 'not-listening',
    name: '경청 부족',
    questionIds: ['b3'],
    why: '요구만 전달하고 사정을 듣지 않으면, 협력사가 가진 현장 정보(더 나은 방법, 실행 불가능한 조건)가 버려진다.',
    actions: [
      '요구 전달 시 협력사 제약·의견을 확인하는 단계를 프로세스에 포함',
      '협력사 제안으로 개선된 사례를 만들고 공유해 "말하면 반영된다"는 신호를 축적',
    ],
  },
];

const LEVELS = ['양호', '주의', '심각'];

function freqStats(rows, qid) {
  let n = 0, once = 0, many = 0;
  for (const r of rows) {
    const v = r.answers[qid];
    if (!Number.isInteger(v)) continue;
    n++;
    if (v >= 1) once++;
    if (v === 2) many++;
  }
  return { n, rate1: n ? once / n : 0, rate2: n ? many / n : 0 };
}

function likertStats(rows, qid) {
  let n = 0, neg = 0, sum = 0;
  for (const r of rows) {
    const v = r.answers[qid];
    if (!Number.isInteger(v)) continue;
    n++;
    sum += v;
    if (v <= 1) neg++;
  }
  return { n, neg: n ? neg / n : 0, avg: n ? sum / n : 0 };
}

function severityFreq(s) {
  if (s.n === 0) return 0;
  if (s.rate2 >= 0.3 || s.rate1 >= 0.5) return 2;
  if (s.rate1 >= 0.2) return 1;
  return 0;
}

function severityLikert(s) {
  if (s.n === 0) return 0;
  if (s.neg >= 0.4) return 2;
  if (s.neg >= 0.2) return 1;
  return 0;
}

const pct = (x) => Math.round(x * 100) + '%';

function computeDiagnosis(rows, questions) {
  const qById = Object.fromEntries(questions.map((q) => [q.id, q]));
  const n = rows.length;

  const types = PROBLEM_TYPES.map((t) => {
    let level = 0;
    const evidence = [];
    for (const qid of t.questionIds) {
      const q = qById[qid];
      if (!q) continue;
      if (q.type === 'freq') {
        const s = freqStats(rows, qid);
        const lv = severityFreq(s);
        level = Math.max(level, lv);
        evidence.push(qid.toUpperCase() + ' 발생률 ' + pct(s.rate1) + ' (여러 번 ' + pct(s.rate2) + ')');
      } else if (q.type === 'likert') {
        const s = likertStats(rows, qid);
        const lv = severityLikert(s);
        level = Math.max(level, lv);
        evidence.push(qid.toUpperCase() + ' 부정률 ' + pct(s.neg) + ' (평균 ' + (s.avg + 1).toFixed(1) + '/5)');
      }
    }
    return {
      id: t.id,
      name: t.name,
      level,
      levelName: LEVELS[level],
      why: t.why,
      evidence,
      // 개선책은 '주의' 이상일 때만 노출한다 (양호한 유형까지 액션이 깔리면 우선순위가 안 보인다)
      actions: level >= 1 ? t.actions : [],
    };
  }).sort((a, b) => b.level - a.level);

  // ---- 전체 신호 (유형 판정과 별개로 결과 해석에 필요한 교차 신호) ----
  const signals = [];

  if (n === 0) {
    signals.push({ kind: 'info', text: '아직 응답이 없습니다.' });
    return { n, types, signals };
  }
  if (n < 5) {
    signals.push({ kind: 'info', text: '응답이 ' + n + '건뿐입니다. 아래 진단은 참고용으로만 보십시오 (5건 이상 권장).' });
  }

  // 솔직도 신호: 다른 문항은 대부분 "없었다"인데 A10(침묵)만 높으면, 착하게 쓴 설문일 가능성
  const a10 = freqStats(rows, 'a10');
  const otherIds = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a9'];
  const avgOther = otherIds.reduce((acc, id) => acc + freqStats(rows, id).rate1, 0) / otherIds.length;
  if (a10.rate1 >= 0.3 && avgOther < 0.15) {
    signals.push({
      kind: 'warn',
      text: 'A1~A9는 대부분 "없었다"인데 A10(불이익 우려로 침묵)만 ' + pct(a10.rate1) +
        '입니다. 문제가 없어서가 아니라 문제를 쓰지 못한 설문일 가능성이 높습니다. 낮은 점수보다 이 패턴을 더 무겁게 보십시오.',
    });
  }

  // 타사 대비 신호: C1에서 "어려운 편" 이상 비율 (비교 대상 없음 제외)
  let cN = 0, cNeg = 0;
  for (const r of rows) {
    const v = r.answers.c1;
    if (!Number.isInteger(v) || v === 5) continue;
    cN++;
    if (v >= 3) cNeg++;
  }
  if (cN > 0 && cNeg / cN >= 0.3) {
    signals.push({
      kind: 'warn',
      text: '타 고객사 대비 "어려운 편" 이상이 ' + pct(cNeg / cN) + '입니다. 개별 항목 점수가 좋아도 이 문항이 나쁘면 앞의 점수는 인사치레일 수 있습니다.',
    });
  }

  // 위치별 격차 신호: 경영·관리자 응답과 현장·실무자 응답의 A파트 발생률 차이
  const groups = { 0: [], 1: [] };
  for (const r of rows) {
    if (r.answers.r1 === 0 || r.answers.r1 === 1) groups[r.answers.r1].push(r);
  }
  if (groups[0].length >= 3 && groups[1].length >= 3) {
    const rateOf = (g) => otherIds.concat('a10').reduce((acc, id) => acc + freqStats(g, id).rate1, 0) / 10;
    const gap = rateOf(groups[1]) - rateOf(groups[0]);
    if (Math.abs(gap) >= 0.25) {
      signals.push({
        kind: 'warn',
        text: '경영·관리자와 현장·실무자의 응답 격차가 큽니다 (발생률 차이 ' + pct(Math.abs(gap)) +
          '). 문제가 실무 접점에서 일어나고 있고 경영진 채널로는 올라오지 않는다는 신호입니다. (이 신호는 사내 공유 금지)',
      });
    }
  }

  return { n, types, signals };
}

module.exports = { computeDiagnosis, PROBLEM_TYPES };
