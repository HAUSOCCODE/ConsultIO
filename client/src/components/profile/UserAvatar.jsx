import { useEffect, useState } from "react";

export default function UserAvatar({ user, className = "" }) {
  const [failed, setFailed] = useState(false);
  const source = user?.profilePicture;

  useEffect(() => setFailed(false), [source]);

  if (source && !failed)
    return (
      <img
        src={source}
        alt={`${user?.name || "User"} profile`}
        onError={() => setFailed(true)}
        className={`${className} object-cover`}
      />
    );

  return (
    <span className={`${className} grid place-items-center`} aria-hidden="true">
      {user?.name?.trim()?.[0]?.toUpperCase() || "U"}
    </span>
  );
}
