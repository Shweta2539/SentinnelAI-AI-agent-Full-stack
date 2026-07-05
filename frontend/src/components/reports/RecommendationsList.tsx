interface RecommendationsListProps {
  recommendations: string[];
}

export function RecommendationsList({ recommendations }: RecommendationsListProps) {
  if (recommendations.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        No recommendations have been generated for this investigation yet.
      </p>
    );
  }

  return (
    <ul className="space-y-2.5">
      {recommendations.map((rec, idx) => (
        <li key={idx} className="flex items-start gap-2.5 text-sm text-ink-muted">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-signal" />
          {rec}
        </li>
      ))}
    </ul>
  );
}
