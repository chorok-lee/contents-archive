export function UrlInput({ autoFocus = false }: { autoFocus?: boolean }) {
  return (
    <form action="/entries/new" className="flex flex-col gap-2 sm:flex-row">
      <label htmlFor="url-input" className="sr-only">
        아티클 URL
      </label>
      <input
        id="url-input"
        name="url"
        type="text"
        inputMode="url"
        autoComplete="off"
        autoFocus={autoFocus}
        required
        placeholder="읽은 글의 URL을 붙여넣으세요"
        className="input flex-1"
      />
      <button type="submit" className="btn btn-primary min-h-11">
        기록 시작
      </button>
    </form>
  );
}
