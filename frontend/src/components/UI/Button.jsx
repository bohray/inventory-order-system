import { cn } from "../../utils/cn.js";

const VARIANTS = {
  primary: "btn-primary",
  ghost: "btn-ghost",
  danger: "btn-danger",
};

export default function Button({
  variant = "primary",
  size,
  className,
  type = "button",
  children,
  ...rest
}) {
  return (
    <button
      type={type}
      className={cn(
        "btn",
        VARIANTS[variant],
        size === "sm" && "btn-sm",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
