import styles from './FormField.module.scss';

type FormFieldProps = {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
};

export default function FormField({ label, htmlFor, required, error, children }: FormFieldProps) {
  return (
    <div className={styles.formGroup}>
      <label htmlFor={htmlFor} className={styles.subTitle}>
        {label} {required && <span className={styles.required}>*</span>}
      </label>
      {children}
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
