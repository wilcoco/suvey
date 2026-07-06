// 설문 문항 정의. {COMPANY} 자리는 서버에서 회사명으로 치환된다.
const FREQ_CHOICES = ['없었다', '1~2회 있었다', '여러 번 있었다'];
const LIKERT_CHOICES = ['전혀 아니다', '아니다', '보통이다', '그렇다', '매우 그렇다'];
const COMPARE_CHOICES = [
  '가장 나은 편',
  '나은 편',
  '보통',
  '어려운 편',
  '가장 어려운 편',
  '비교 대상 없음',
];

const QUESTIONS = [
  // A. 행동 빈도 (최근 6개월)
  { id: 'a1', part: 'A', type: 'freq', text: '작업 지시나 요구사항이 문서 없이 구두·전화·메신저로만 전달된 경우' },
  { id: 'a2', part: 'A', type: 'freq', text: '이미 합의된 일정·수량·사양이 사전 협의 없이 일방적으로 변경된 경우' },
  { id: 'a3', part: 'A', type: 'freq', text: '무리한 납기나 수량을 요구받고, 그에 따른 비용이나 부담은 우리 쪽이 진 경우' },
  { id: 'a4', part: 'A', type: 'freq', text: '계약이나 발주 범위에 없는 업무를 요구받은 경우' },
  { id: 'a5', part: 'A', type: 'freq', text: '준비 시간 없이 당일 또는 전날 통보로 방문·회의를 요구받은 경우' },
  { id: 'a6', part: 'A', type: 'freq', text: '문의나 요청에 대해 답을 받지 못한 채 사안이 흐지부지된 경우' },
  { id: 'a7', part: 'A', type: 'freq', text: '같은 사안에 대해 {COMPANY} 내 여러 사람에게서 서로 다른 지시를 받은 경우' },
  { id: 'a8', part: 'A', type: 'freq', text: '문제 발생 시 원인 검토 없이 우리 쪽 책임으로 먼저 규정된 경우' },
  { id: 'a9', part: 'A', type: 'freq', text: '{COMPANY} 담당자로부터 반말, 언성, 모욕감을 느끼는 언행을 겪은 경우' },
  { id: 'a10', part: 'A', type: 'freq', text: '불만이나 이견을 말하고 싶었지만 거래에 불이익이 있을까 봐 참은 경우' },

  // B. 소통 구조 (5점 척도)
  { id: 'b1', part: 'B', type: 'likert', text: '사안이 생겼을 때 {COMPANY}의 누구에게 연락해야 하는지 명확하다.' },
  { id: 'b2', part: 'B', type: 'likert', text: '{COMPANY}에 문제를 제기하면 해결까지 책임지고 챙기는 사람이 있다.' },
  { id: 'b3', part: 'B', type: 'likert', text: '{COMPANY}는 요구만 전달하는 것이 아니라, 우리 쪽 상황과 제약도 듣는다.' },

  // C. 종합
  { id: 'c1', part: 'C', type: 'compare', text: '거래하는 고객사가 여러 곳이라면, 소통과 업무 방식 면에서 {COMPANY}는 어느 수준입니까?' },
  { id: 'c2', part: 'C', type: 'text', text: '{COMPANY}와의 거래에서 다른 협력사들이 공통적으로 느낄 만한 어려움이 있다면 무엇이라고 생각하십니까?' },
  { id: 'c3', part: 'C', type: 'text', text: '{COMPANY} 대표이사가 이것 하나는 꼭 알아야 한다고 생각하는 것이 있다면 적어주십시오.' },
];

const PART_INFO = {
  A: { title: '최근 6개월간의 경험', desc: '아래와 같은 일을 경험한 적이 있습니까?' },
  B: { title: '소통 구조', desc: '평소 느끼시는 정도를 선택해 주십시오.' },
  C: { title: '종합', desc: '' },
};

const CHOICES = { freq: FREQ_CHOICES, likert: LIKERT_CHOICES, compare: COMPARE_CHOICES };

module.exports = { QUESTIONS, PART_INFO, CHOICES };
