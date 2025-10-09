const AuthForm = ({
  title,
  children,
  onSubmit,
  submitText,
  extraText,
  extraLinkText,
  onExtraLinkClick,
}) => {

  

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">{title}</h2>

        <form className="space-y-4" onSubmit={onSubmit}>
          {children}
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            {submitText}
          </button>
        </form>

        {extraText && (
          <div className="mt-4 text-sm text-gray-400 text-center">
            {extraText}{" "}
            <button
              onClick={onExtraLinkClick}
              className="text-blue-400 hover:underline font-semibold"
            >
              {extraLinkText}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default AuthForm;
