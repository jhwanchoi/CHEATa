/**
 * Service for analyzing text using the backend API
 */

// Backend API URL (will be replaced with environment variable in production)
const API_URL = 'http://localhost:8000';

/**
 * 텍스트 세그먼트 분석 결과
 */
export interface TextSegment {
  start: number;
  end: number;
  reason: string;
}

/**
 * Type definition for analysis response
 */
export interface AnalysisResponse {
  isFake: boolean;
  confidence: number;
  explanation: string;
  evidences: string[];
  analyzedText: string; // 분석된 원본 텍스트
  suspiciousSegments: TextSegment[]; // 의심스러운 부분
}

/**
 * 패턴 목록: 텍스트에서 찾을 수 있는 패턴과 그 신뢰도
 */
const patterns = [
  // 과장/확대 표현
  { pattern: /확실히|절대적|100\%|틀림없이|명백히|매우 높은|전례 없는|역대급|사상 최고|파격적/g, reason: "exaggeration", isSuspicious: true },
  { pattern: /모든 사람이|누구나 다|전 세계적으로|전 국민이|모두가|전부|다|항상|결코|절대로|반드시/g, reason: "exaggeration", isSuspicious: true },

  // 근거 없는 주장
  { pattern: /(?:주장|말)(?:했|한)다|(?:밝혔|드러났)다/g, reason: "claim", isSuspicious: true },
  { pattern: /것으로 보인다|것으로 판단된다|것으로 예상된다|것으로 추정된다|것으로 알려졌다|전해졌다/g, reason: "speculation", isSuspicious: true },
  { pattern: /\~일 것이다|\~할 것이다|\~라는 것이다|\~다는 것이다/g, reason: "speculation", isSuspicious: true },

  // 오해 소지 표현
  { pattern: /놀라운|충격적인|믿을 수 없는|경악스러운|참담한|심각한|심히 우려되는|격분한|격앙된/g, reason: "misleading", isSuspicious: true },
  { pattern: /여러분은 반드시|당신은 꼭|즉시|서두르세요|지금 당장|늦기 전에|기회를 놓치지 마세요/g, reason: "misleading", isSuspicious: true },

  // 출처 불명 표현
  { pattern: /\b(?:연구|보고서|통계|조사)에 따르면\b(?!(?:\s+\S+){0,5}\s+(?:대학교|연구소|기관))/g, reason: "unverified", isSuspicious: true },
  { pattern: /\b(?:전문가들|과학자들|관계자들)은\b(?!(?:\s+\S+){0,10}\s+(?:대학교|연구소|기관|이름))/g, reason: "unverified", isSuspicious: true },
  { pattern: /\b(?:소식통|관계자|내부자)에 따르면\b/g, reason: "unverified", isSuspicious: true },

  // 의심스러운 내용
  { pattern: /비밀|숨겨진 진실|알려지지 않은|대중이 모르는|차마 말할 수 없는|충격 실체|폭로|음모|배후/g, reason: "suspicious", isSuspicious: true },

  // 편향된 표현
  { pattern: /강성 지지층|극렬 지지자|맹목적 지지|광신도|종북|수구|꼴통|좌파|우파|진보|보수|친일|친중|친북|친미|매국노/g, reason: "biased", isSuspicious: true },
  { pattern: /정치 공작|정치 보복|표적 수사|억지 주장|억지 논리|내로남불|내부 총질|패거리|비리|부패|무능|무책임|기득권|특권층|엘리트/g, reason: "biased", isSuspicious: true },

  // 긍정적 패턴 - 사실 기반
  { pattern: /\d{4}년\s+\d{1,2}월\s+\d{1,2}일|\d{4}\.\d{1,2}\.\d{1,2}|\d{4}-\d{1,2}-\d{1,2}/g, reason: "factual", isSuspicious: false },
  { pattern: /\b(?:서울대학교|연세대학교|고려대학교|한국과학기술원|카이스트|서강대학교|이화여자대학교)\b/g, reason: "source", isSuspicious: false },

  // 증거와 출처
  { pattern: /\b(?:연구 결과|논문|학술지)\b(?=(?:\s+\S+){0,5}\s+(?:발표|게재|출판))/g, reason: "evidence", isSuspicious: false },
  { pattern: /\b(?:교수|박사|연구원|전문가)(?:\s+\S+){0,3}\s+(?:밝혔|말했|설명했|강조했|지적했)/g, reason: "expert", isSuspicious: false },
  { pattern: /(?:인용|참고|출처|참조)(?:\s+\S+){0,3}(?:따르면|의하면|의견)/g, reason: "referenced", isSuspicious: false },

  // 공식 정보
  { pattern: /\b(?:통계청|보건복지부|교육부|외교부|행정안전부|법무부|국방부|국토교통부|환경부|기획재정부)\b/g, reason: "official", isSuspicious: false },
  { pattern: /\b(?:대법원|헌법재판소|중앙선거관리위원회|국가인권위원회)\b/g, reason: "official", isSuspicious: false },

  // 균형 잡힌 시각
  { pattern: /한편|반면|그러나|하지만|그럼에도|다른 측면에서는|다양한 의견|여러 시각|찬반 의견/g, reason: "balanced", isSuspicious: false },
];

/**
 * 한국어 패턴 설명 매핑
 */
const patternExplanations: Record<string, string> = {
  "exaggeration": "과장된 표현",
  "claim": "근거 없는 주장",
  "speculation": "추측성 표현",
  "misleading": "오해의 소지가 있는 표현",
  "unverified": "출처가 불분명한 정보",
  "suspicious": "의심스러운 내용",
  "biased": "편향된 표현",
  "factual": "구체적인 날짜 정보",
  "source": "신뢰할 수 있는 출처",
  "evidence": "연구 결과나 증거",
  "expert": "전문가 의견",
  "referenced": "참조 출처",
  "official": "공식 기관 정보",
  "balanced": "균형 잡힌 관점"
};

/**
 * 텍스트에서 패턴 검색
 */
const findPatterns = (text: string): TextSegment[] => {
  const segments: TextSegment[] = [];

  // 각 패턴에 대해 검색
  patterns.forEach(({ pattern, reason, isSuspicious }) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      segments.push({
        start: match.index,
        end: match.index + match[0].length,
        reason: reason
      });

      // lastIndex가 올바르게 설정되었는지 확인 (일부 브라우저에서는 필요)
      if (pattern.lastIndex === match.index) {
        pattern.lastIndex++;
      }
    }

    // 정규식 패턴 리셋 (전역 플래그로 인해 필요)
    pattern.lastIndex = 0;
  });

  // 위치에 따라 정렬
  segments.sort((a, b) => a.start - b.start);

  return segments;
};

/**
 * 텍스트의 일부를 추출하는 유틸리티 함수
 */
const extractTextSegment = (text: string, start: number, end: number, contextLength: number = 20): string => {
  const maxLength = text.length;
  const segmentStart = Math.max(0, start - contextLength);
  const segmentEnd = Math.min(maxLength, end + contextLength);

  let result = '';
  if (segmentStart > 0) result += '... ';
  result += text.substring(segmentStart, segmentEnd);
  if (segmentEnd < maxLength) result += ' ...';

  return result;
};

// 개발용 모의 분석 함수
const mockAnalyze = (text: string): AnalysisResponse => {
  // 텍스트에서 패턴 찾기
  const suspiciousSegments = findPatterns(text);

  // 텍스트에서 발견된 의심스러운 패턴과 긍정적인 패턴 개수 확인
  const suspiciousCount = suspiciousSegments.filter(segment =>
    ["exaggeration", "claim", "speculation", "misleading", "unverified", "suspicious", "biased"].includes(segment.reason)
  ).length;

  const positiveCount = suspiciousSegments.filter(segment =>
    ["factual", "source", "evidence", "expert", "referenced", "official", "balanced"].includes(segment.reason)
  ).length;

  // 신뢰도 및 가짜 여부 계산
  const isFake = suspiciousCount > positiveCount;

  // 신뢰도는 기본값에서 시작하여 의심스러운 패턴당 10점씩 감소하거나 긍정적 패턴당 5점씩 증가
  let confidence = 50; // 기본값

  // 의심스러운 패턴 당 신뢰도 감소
  if (isFake) {
    confidence = Math.min(90, 50 + suspiciousCount * 8);
  } else {
    confidence = Math.min(90, 50 + positiveCount * 8);
  }

  // 특정 패턴이 너무 많아도 신뢰도 조정
  if (suspiciousCount > 5 && isFake) {
    confidence = Math.min(95, confidence + 10);
  }
  if (positiveCount > 5 && !isFake) {
    confidence = Math.min(95, confidence + 10);
  }

  // 의심스러운 구문 추출하여 evidences 생성
  const generateEvidences = (): string[] => {
    if (suspiciousSegments.length === 0) {
      return isFake
        ? ["텍스트에서 특정 패턴은 발견되지 않았지만, 전체적인 내용이 의심스럽습니다."]
        : ["텍스트에서 특정 패턴은 발견되지 않았지만, 전체적인 내용이 신뢰할 수 있습니다."];
    }

    const evidences: string[] = [];
    const foundPatterns: Record<string, string[]> = {};

    // 각 세그먼트를 패턴별로 그룹화
    suspiciousSegments.forEach(segment => {
      const { reason } = segment;
      const segmentText = text.substring(segment.start, segment.end);

      if (!foundPatterns[reason]) {
        foundPatterns[reason] = [];
      }

      if (!foundPatterns[reason].includes(segmentText)) {
        foundPatterns[reason].push(segmentText);
      }
    });

    // 각 패턴 그룹에 대한 설명 생성
    Object.entries(foundPatterns).forEach(([reason, segments]) => {
      const explanation = patternExplanations[reason] || reason;
      const isSuspicious = ["exaggeration", "claim", "speculation", "misleading", "unverified", "suspicious", "biased"].includes(reason);

      if (segments.length > 0) {
        // 최대 3개까지만 예시로 표시
        const examples = segments.slice(0, 3).map(s => `"${s}"`).join(', ');
        const moreText = segments.length > 3 ? ` 외 ${segments.length - 3}개` : '';

        if (isSuspicious) {
          evidences.push(`${explanation}이(가) 발견되었습니다: ${examples}${moreText}`);
        } else {
          evidences.push(`신뢰할 수 있는 ${explanation}이(가) 포함되어 있습니다: ${examples}${moreText}`);
        }
      }
    });

    return evidences;
  };

  // 결과 생성
  return {
    isFake,
    confidence,
    explanation: isFake
      ? "이 텍스트는 잠재적으로 오해의 소지가 있는 정보를 포함하고 있습니다. 신뢰할 수 있는 출처가 언급되지 않았으며, 여러 논리적 불일치가 발견됩니다. (개발용 모의 응답)"
      : "이 텍스트는 제공된 정보를 기반으로 사실적으로 정확한 것으로 보입니다. 내용이 논리적 일관성을 유지하고 비교적 중립적인 언어를 사용합니다. (개발용 모의 응답)",
    evidences: generateEvidences(),
    analyzedText: text,
    suspiciousSegments
  };
};

/**
 * Analyze text for fake information
 * @param text Text to analyze
 * @returns Promise with analysis result
 */
export const analyzeText = async (text: string): Promise<AnalysisResponse> => {
  try {
    const response = await fetch(`${API_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to analyze text');
    }

    return await response.json();
  } catch (error) {
    console.error('Error analyzing text:', error);

    // 개발 환경이거나 네트워크 오류일 경우 모의 데이터 반환
    if (error instanceof TypeError || String(error).includes('Failed to fetch')) {
      console.log('Using mock data as backend is unreachable');
      return mockAnalyze(text);
    }

    throw error;
  }
}; 