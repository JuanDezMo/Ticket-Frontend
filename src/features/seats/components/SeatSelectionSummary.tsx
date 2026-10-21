interface SeatSelectionSummaryProps {
  selectedLabel: string | null;
  lostSeatLabel: string | null;
}

export const SEAT_LOST_MESSAGE = 'Your selected seat is no longer available';

export function SeatSelectionSummary({ selectedLabel, lostSeatLabel }: SeatSelectionSummaryProps) {
  if (selectedLabel) {
    return (
      <p role="status" className="font-medium">
        Selected seat: {selectedLabel}
      </p>
    );
  }
  if (lostSeatLabel) {
    return (
      <p role="alert" className="text-destructive text-sm">
        {SEAT_LOST_MESSAGE}
      </p>
    );
  }
  return <p className="text-muted-foreground text-sm">Select an available seat.</p>;
}
