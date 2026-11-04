interface DeveloperSignatureProps {
  className?: string;
}

export const DeveloperSignature = ({ className = "" }: DeveloperSignatureProps) => (
  <p className={className}>
    Developed by BG_DevOpps · Contact number:{" "}
    <a href="tel:+263784654328" className="font-medium hover:text-accent transition-colors">
      0784654328
    </a>
  </p>
);
