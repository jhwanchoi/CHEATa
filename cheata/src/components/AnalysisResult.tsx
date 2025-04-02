import React, { useState } from 'react';

/**
 * Interface for the analysis result data
 */
interface AnalysisResultProps {
  isLoading: boolean;
  result: {
    isFake: boolean;
    confidence: number;
    explanation: string;
    evidences?: string[];
    analyzedText?: string;
    suspiciousSegments?: Array<{ start: number, end: number, reason: string }>;
  } | null;
  error: string | null;
}

/**
 * 신뢰도 점수에 따른 한국어 설명 생성
 */
const getKoreanExplanation = (isFake: boolean, confidence: number): string => {
  if (isFake) {
    if (confidence > 90) {
      return "이 정보는 매우 높은 확률로 가짜 또는 오해의 소지가 있습니다. 여러 신뢰할 수 있는 출처를 통해 사실 확인을 강력히 권장합니다.";
    } else if (confidence > 70) {
      return "이 정보는 가짜일 가능성이 높습니다. 다른 신뢰할 수 있는 출처를 통해 확인하는 것이 좋습니다.";
    } else if (confidence > 50) {
      return "이 정보는 일부 오해의 소지가 있는 내용을 포함하고 있을 수 있습니다. 주의해서 받아들이는 것이 좋습니다.";
    } else {
      return "이 정보는 약간의 의심스러운 요소가 있지만, 완전히 가짜라고 단정하기는 어렵습니다.";
    }
  } else {
    if (confidence > 90) {
      return "이 정보는 매우 높은 확률로 사실이며 신뢰할 수 있습니다.";
    } else if (confidence > 70) {
      return "이 정보는 대체로 사실로 판단되며 신뢰할 수 있는 내용을 포함하고 있습니다.";
    } else if (confidence > 50) {
      return "이 정보는 일부 사실적인 요소를 포함하고 있으나, 모든 세부 사항이 완전히 검증된 것은 아닙니다.";
    } else {
      return "이 정보는 신뢰할 수 있는 요소가 있지만, 일부 내용에 대해서는 추가적인 확인이 필요합니다.";
    }
  }
};

/**
 * 의심스러운 단어나 패턴에 대한 한국어 설명
 */
const getSuspiciousPatternExplanation = (pattern: string): string => {
  const patternMap: Record<string, string> = {
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

  return patternMap[pattern.toLowerCase()] || "의심스러운 패턴";
};

/**
 * 패턴별 상세 설명 제공
 */
const getPatternDetailedExplanation = (pattern: string): string => {
  const detailedExplanations: Record<string, string> = {
    "exaggeration": "과장된 표현은 사실을 확대하거나 왜곡할 수 있으며, 객관적 정보 전달보다 감정적 반응을 유도하는 경향이 있습니다.",
    "claim": "근거 없는 주장은 검증 가능한 출처나 증거 없이 제시된 정보로, 신뢰성이 낮을 수 있습니다.",
    "speculation": "추측성 표현은 확인된 사실이 아닌 작성자의 주관적 예상이나 추정으로, 사실과 다를 수 있습니다.",
    "misleading": "오해의 소지가 있는 표현은 독자를 특정 방향으로 유도하거나 사실을 왜곡하여 전달할 가능성이 있습니다.",
    "unverified": "출처가 불분명한 정보는 검증하기 어렵고, 신뢰성을 확인할 수 없어 주의가 필요합니다.",
    "suspicious": "의심스러운 내용은 일반적으로 받아들여지는 사실과 충돌하거나 검증하기 어려운 극단적 주장을 포함합니다.",
    "biased": "편향된 표현은 특정 관점이나 입장에서 정보를 제시하며, 객관적 사실 전달보다 특정 견해를 강화하는 경향이 있습니다.",
    "factual": "구체적인 날짜 정보는 검증 가능한 사실을 제시하여 신뢰성을 높이는 요소입니다.",
    "source": "신뢰할 수 있는 출처는 정보의 정확성과 신뢰성을 뒷받침하는 중요한 요소입니다.",
    "evidence": "연구 결과나 증거는 주장을 뒷받침하는 객관적 데이터로, 정보의 신뢰성을 높입니다.",
    "expert": "전문가 의견은 해당 분야의 전문 지식을 바탕으로 한 분석으로, 일반적인 견해보다 신뢰성이 높을 수 있습니다.",
    "referenced": "참조 출처가 있는 정보는 검증 가능성이 높아 더 신뢰할 수 있습니다.",
    "official": "공식 기관 정보는 권위 있는 기관에서 제공하는 공식 데이터로, 신뢰성이 높은 편입니다.",
    "balanced": "균형 잡힌 관점은 다양한 시각에서 정보를 제시하여 편향을 줄이고 객관성을 높이는 요소입니다."
  };

  return detailedExplanations[pattern.toLowerCase()] || "이 패턴은 텍스트의 신뢰성에 영향을 미칠 수 있습니다.";
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

/**
 * Component to display AI analysis results
 * @returns React component
 */
const AnalysisResult: React.FC<AnalysisResultProps> = ({ isLoading, result, error }) => {
  const [selectedPatternType, setSelectedPatternType] = useState<string | null>(null);
  const [highlightedText, setHighlightedText] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="p-4 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-2"></div>
        <p className="text-gray-700">텍스트 분석 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <h3 className="text-red-700 font-medium mb-2">오류</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const { isFake, confidence, explanation, evidences = [], analyzedText = "" } = result;
  const koreanExplanation = getKoreanExplanation(isFake, confidence);

  // 서버에서 제공하지 않는 경우 임시 의심 세그먼트 생성 (개발용)
  const generateSuspiciousSegments = () => {
    if (!analyzedText || analyzedText.length === 0) return [];

    // 개발용: 텍스트를 임의의 구간으로 나누어 의심 세그먼트 생성
    const segments = [];
    const possibleReasons = [
      "misleading", "unverified", "claim", "exaggeration", "speculation", "biased",
      "source", "factual", "accurate"
    ];

    // 임의의 위치에 2-3개의 세그먼트 추가
    const numSegments = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < numSegments; i++) {
      const textLength = analyzedText.length;
      const segmentLength = 5 + Math.floor(Math.random() * 10);
      const start = Math.floor(Math.random() * (textLength - segmentLength));
      const end = start + segmentLength;
      const reasonIndex = Math.floor(Math.random() * possibleReasons.length);

      segments.push({
        start,
        end,
        reason: possibleReasons[reasonIndex]
      });
    }

    return segments;
  };

  const suspiciousSegments = result.suspiciousSegments || generateSuspiciousSegments();

  // 패턴 유형별로 세그먼트 그룹화
  const groupedSegments: Record<string, typeof suspiciousSegments> = {};

  suspiciousSegments.forEach(segment => {
    if (!groupedSegments[segment.reason]) {
      groupedSegments[segment.reason] = [];
    }
    groupedSegments[segment.reason].push(segment);
  });

  // 원본 텍스트에 하이라이트 표시
  const renderHighlightedText = () => {
    if (!analyzedText) return null;

    // 모든 세그먼트를 중첩되지 않도록 정렬
    const sortedSegments = [...suspiciousSegments].sort((a, b) => a.start - b.start);

    const isSuspiciousPattern = (reason: string) => {
      return ["exaggeration", "claim", "speculation", "misleading", "unverified", "suspicious", "biased"].includes(reason);
    };

    // 텍스트 조각들 생성
    const textPieces: JSX.Element[] = [];
    let lastEnd = 0;

    sortedSegments.forEach((segment, index) => {
      // 현재 세그먼트 이전의 일반 텍스트
      if (segment.start > lastEnd) {
        textPieces.push(
          <span key={`text-${index}`}>{analyzedText.substring(lastEnd, segment.start)}</span>
        );
      }

      // 하이라이트된 텍스트
      const segmentText = analyzedText.substring(segment.start, segment.end);
      const isHighlighted = selectedPatternType === segment.reason || selectedPatternType === null;
      const isSuspicious = isSuspiciousPattern(segment.reason);

      textPieces.push(
        <mark
          key={`mark-${index}`}
          className={`px-0.5 rounded ${isHighlighted ? (isSuspicious ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800') : 'bg-gray-100 text-gray-800'}`}
          onClick={() => setHighlightedText(segmentText)}
          title={`${getSuspiciousPatternExplanation(segment.reason)}: "${segmentText}"`}
          style={{ cursor: 'pointer' }}
        >
          {segmentText}
        </mark>
      );

      lastEnd = segment.end;
    });

    // 마지막 세그먼트 이후의 텍스트
    if (lastEnd < analyzedText.length) {
      textPieces.push(
        <span key="text-end">{analyzedText.substring(lastEnd)}</span>
      );
    }

    return (
      <div className="mb-3 p-2 bg-gray-50 rounded border border-gray-200">
        <p className="text-gray-700 font-medium mb-2">📄 원문 분석:</p>
        <div className="text-gray-700 p-2 bg-white rounded border border-gray-100 whitespace-pre-wrap">
          {textPieces}
        </div>
        {highlightedText && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
            <p className="font-medium text-yellow-800">선택한 부분: "{highlightedText}"</p>
          </div>
        )}
      </div>
    );
  };

  // 패턴 유형별 필터 버튼 생성
  const renderFilterButtons = () => {
    const patternTypes = Object.keys(groupedSegments);
    if (patternTypes.length === 0) return null;

    return (
      <div className="mb-3">
        <p className="text-gray-700 font-medium mb-2">🔍 패턴 필터:</p>
        <div className="flex flex-wrap gap-2">
          <button
            className={`px-2 py-1 text-xs rounded-full ${selectedPatternType === null ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setSelectedPatternType(null)}
          >
            모두 보기
          </button>
          {patternTypes.map(type => (
            <button
              key={type}
              className={`px-2 py-1 text-xs rounded-full ${selectedPatternType === type ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => setSelectedPatternType(type)}
            >
              {getSuspiciousPatternExplanation(type)} ({groupedSegments[type].length})
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 border rounded-md">
      <div className={`p-3 mb-4 rounded-md ${isFake ? 'bg-red-50' : 'bg-green-50'}`}>
        <h3 className={`font-medium mb-1 ${isFake ? 'text-red-700' : 'text-green-700'}`}>
          {isFake ? '⚠️ 잠재적으로 오해의 소지가 있는 정보' : '✅ 신뢰할 수 있는 정보'}
        </h3>
        <div className="flex items-center mb-2">
          <span className="text-gray-700 mr-2">신뢰도:</span>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full ${isFake ? 'bg-red-600' : 'bg-green-600'}`}
              style={{ width: `${confidence}%` }}>
            </div>
          </div>
          <span className="ml-2 text-sm text-gray-600">{confidence}%</span>
        </div>
      </div>

      <div>
        <h4 className="font-medium text-gray-800 mb-3">분석 결과:</h4>

        {/* 전체 요약 설명 */}
        <div className="mb-3 p-2 bg-gray-50 rounded border border-gray-200">
          <p className="text-gray-700 font-medium">🇰🇷 요약:</p>
          <p className="text-gray-700 mb-2">{koreanExplanation}</p>
        </div>

        {/* 원문 하이라이트 */}
        {renderHighlightedText()}

        {/* 패턴 필터 버튼 */}
        {renderFilterButtons()}

        {/* 구체적인 의심 부분 하이라이트 */}
        {suspiciousSegments && suspiciousSegments.length > 0 && (
          <div className="mb-3 p-2 bg-gray-50 rounded border border-gray-200">
            <p className="text-gray-700 font-medium">🔍 구체적인 분석:</p>
            <ul className="list-none pl-0 text-gray-700 mt-2 divide-y divide-gray-200">
              {Object.entries(groupedSegments)
                .filter(([reason]) => selectedPatternType === null || selectedPatternType === reason)
                .map(([reason, segments]) => (
                  <li key={reason} className="py-2">
                    <div className="flex items-center mb-1">
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${["exaggeration", "claim", "speculation", "misleading", "unverified", "suspicious", "biased"].includes(reason) ? 'bg-red-500' : 'bg-green-500'}`}></span>
                      <span className="font-medium">{getSuspiciousPatternExplanation(reason)}</span>
                      <span className="ml-2 text-xs bg-gray-200 px-1.5 py-0.5 rounded-full">{segments.length}개</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 pl-4">{getPatternDetailedExplanation(reason)}</p>
                    <ul className="list-disc pl-8 space-y-2">
                      {segments.map((segment, index) => (
                        <li key={index} className="text-sm">
                          <div className={`p-1 rounded ${["exaggeration", "claim", "speculation", "misleading", "unverified", "suspicious", "biased"].includes(reason) ? 'bg-red-100' : 'bg-green-100'}`}>
                            <span className="font-medium">"{analyzedText.substring(segment.start, segment.end)}"</span>
                          </div>
                          <p className="text-xs italic mt-1 text-gray-500">
                            문맥: {extractTextSegment(analyzedText, segment.start, segment.end, 30)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
            </ul>
          </div>
        )}

        {/* 서버에서 제공한 근거 목록 */}
        {evidences && evidences.length > 0 && (
          <div className="mb-3 p-2 bg-gray-50 rounded border border-gray-200">
            <p className="text-gray-700 font-medium">📋 주요 근거:</p>
            <ul className="list-disc pl-5 text-gray-700 mt-1">
              {evidences.map((evidence, index) => (
                <li key={index} className="mt-1">{evidence}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 영어 분석 결과 (접을 수 있게) */}
        <details className="p-2 bg-gray-50 rounded border border-gray-200">
          <summary className="text-gray-700 font-medium cursor-pointer">🇺🇸 영어 분석 보기</summary>
          <p className="text-gray-700 mt-2">{explanation}</p>
        </details>
      </div>
    </div>
  );
};

export default AnalysisResult; 