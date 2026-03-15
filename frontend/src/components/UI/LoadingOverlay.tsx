import React from "react";
import styles from "./LoadingOverlay.module.css";

interface Props {
  message?: string;
}

export const LoadingOverlay: React.FC<Props> = ({ message = "Loading…" }) => (
  <div className={styles.overlay}>
    <div className={styles.spinner} />
    <span className={styles.message}>{message}</span>
  </div>
);
