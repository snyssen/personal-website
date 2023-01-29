import { h } from "preact";
import { useState } from "preact/hooks";
import { ExtractValueFromInputEvent } from "../utils/FormsUtils";

export default function SearchInput() {
  const [searchText, setsearchText] = useState<string>("");
  const onSearchInput = (e: React.FormEvent<HTMLInputElement>) =>
    setsearchText(ExtractValueFromInputEvent(e));

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("searchText: ", searchText);
  };

  return (
    <form onSubmit={onSubmit}>
      <label for="search-input" class="sr-only">
        Input for searching posts
      </label>
      <input
        id="search-input"
        placeholder="Search post..."
        type="text"
        value={searchText}
        onInput={onSearchInput}
      ></input>
    </form>
  );
}
