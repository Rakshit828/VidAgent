export default function InputFieldsWrapper({ children }) {
  return (
    <div className="w-full mx-auto flex justify-center px-2 sm:px-4 mt-2">
      <div className="w-full max-w-lg flex flex-col gap-3 items-center bg-transparent">
        {children}
      </div>
    </div>
  );
}
