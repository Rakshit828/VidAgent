export default function InputFieldsWrapper({ children }) {
  return (
    <div className="w-full flex justify-center px-2 sm:px-4 mb-2 mt-2">
      <div
        className="w-full max-w-sm sm:max-w-md md:max-w-lg 
                   flex flex-col gap-2 items-center"
      >
        {children}
      </div>
    </div>
  );
}
