import { KENYA_COUNTIES_PILOT } from "@msingi/domain";
import { createProjectAction } from "../../actions";

export default function NewProjectPage() {
  return (
    <div>
      <h1>New project</h1>
      <p className="sub">
        Creates the project record, the site, the owner party, and (if the
        email is new) sends the owner their portal invitation.
      </p>
      <div className="card">
        <form className="stack" action={createProjectAction}>
          <label>
            Project name
            <input name="name" required placeholder="Wanjiru residence, Kikuyu" />
          </label>
          <label>
            Owner full name
            <input name="ownerName" required placeholder="Grace Wanjiru" />
          </label>
          <label>
            Owner email (portal access)
            <input name="ownerEmail" type="email" required />
          </label>
          <label>
            County
            <select name="county" required defaultValue="Kiambu">
              {KENYA_COUNTIES_PILOT.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label>
            Site label
            <input name="siteLabel" required placeholder="Kikuyu, Thogoto — ⅛ acre" />
          </label>
          <label>
            Parcel / title number (optional)
            <input name="parcelNo" placeholder="KJD/KITENGELA/..." />
          </label>
          <label>
            Estimated construction value (KES)
            <input
              name="constructionValueKes"
              type="number"
              min="500000"
              step="10000"
              required
              placeholder="15000000"
            />
          </label>
          <label>
            Delivery fee (%)
            <input
              name="feePercent"
              type="number"
              min="4"
              max="10"
              step="0.1"
              defaultValue="6.5"
              required
            />
          </label>
          <button type="submit">Create project</button>
        </form>
      </div>
    </div>
  );
}
