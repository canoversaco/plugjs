import React from "react";

export default class LoginView extends React.Component {
  state = { username: "", password: "", error: "" };

  handleLogin = () => {
    const { users, onLogin } = this.props;
    const { username, password } = this.state;
    if (!username || !password) {
      this.setState({ error: "Bitte Benutzername und Passwort eingeben." });
      return;
    }
    const user = users.find(
      (u) => u.username === username && u.password === password
    );
    if (!user) {
      this.setState({ error: "Login fehlgeschlagen. Prüfe Name & Passwort." });
      return;
    }
    this.setState({ error: "" });
    onLogin(user);
  };

  render() {
    const { users } = this.props;
    const { username, password, error } = this.state;

    return (
      <div
        style={{
          background: "linear-gradient(135deg,#10121a 60%,#1b2330 100%)",
          minHeight: "100vh",
          minWidth: "100vw",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Inter',sans-serif",
        }}
      >
        <div
          style={{
            background: "linear-gradient(101deg,#181b24 80%,#23262e 100%)",
            borderRadius: 28,
            boxShadow: "0 10px 48px #000c,0 0px 0px 3.5px #e3ff6425",
            padding: "42px 34px 38px 34px",
            minWidth: 330,
            width: "97vw",
            maxWidth: 340,
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0,
          }}
        >
          {/* Icon/Banner */}
          <div
            style={{
              fontSize: 48,
              marginBottom: 3,
              filter: "drop-shadow(0 6px 18px #e3ff6459)",
              textShadow: "0 1px 22px #e3ff6459",
              userSelect: "none",
            }}
          >
            🪙
          </div>
          <div
            style={{
              fontWeight: 900,
              fontSize: 27,
              color: "#e3ff64",
              letterSpacing: 1,
              marginBottom: 7,
              textAlign: "center",
              textShadow: "0 4px 20px #e3ff6415",
              fontFamily: "inherit",
            }}
          >
            Login
          </div>
          <div
            style={{
              color: "#38bdf8",
              fontWeight: 700,
              fontSize: 15.2,
              marginBottom: 26,
              textAlign: "center",
              letterSpacing: 0.1,
              opacity: 0.98,
            }}
          >
            Willkommen zurück!<br />
            Bitte melde dich an.
          </div>

          {/* Username */}
          <input
            type="text"
            placeholder="Benutzername"
            value={username}
            onChange={(e) => this.setState({ username: e.target.value })}
            list="usernames"
            style={{
              width: "100%",
              padding: "13px 15px",
              borderRadius: 11,
              border: "2px solid #18181b",
              outline: "none",
              fontSize: 17.5,
              fontWeight: 700,
              background: "#111217",
              color: "#e3ff64",
              marginBottom: 11,
              transition: "border 0.15s, box-shadow 0.15s",
              boxShadow:
                username && username.length > 1
                  ? "0 0 0 2px #38bdf833"
                  : "0 0 0 0px transparent",
            }}
            onFocus={e => e.target.style.border = "2px solid #38bdf8"}
            onBlur={e => e.target.style.border = "2px solid #18181b"}
            onKeyDown={(e) => e.key === "Enter" && this.handleLogin()}
            autoFocus
            autoComplete="username"
          />
          <datalist id="usernames">
            {users.map((u) => (
              <option key={u.id} value={u.username} />
            ))}
          </datalist>

          {/* Passwort */}
          <div style={{ position: "relative", width: "100%" }}>
            <input
              type="password"
              placeholder="Passwort"
              value={password}
              onChange={(e) => this.setState({ password: e.target.value })}
              style={{
                width: "100%",
                padding: "13px 15px",
                borderRadius: 11,
                border: "2px solid #18181b",
                outline: "none",
                fontSize: 17.5,
                fontWeight: 700,
                background: "#111217",
                color: "#fff",
                marginBottom: 13,
                transition: "border 0.15s, box-shadow 0.15s",
                boxShadow:
                  password && password.length > 2
                    ? "0 0 0 2px #a3e63544"
                    : "0 0 0 0px transparent",
                letterSpacing: 1.2,
              }}
              onFocus={e => e.target.style.border = "2px solid #a3e635"}
              onBlur={e => e.target.style.border = "2px solid #18181b"}
              onKeyDown={(e) => e.key === "Enter" && this.handleLogin()}
              autoComplete="current-password"
            />
            {/* Password eye/emoji */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                right: 16,
                transform: "translateY(-52%)",
                fontSize: 18,
                color: "#a1a1aa",
                opacity: 0.5,
                userSelect: "none",
              }}
              title="Sichtbar machen (bald)"
            >
              👁️
            </div>
          </div>

          {/* Button */}
          <button
            onClick={this.handleLogin}
            style={{
              width: "100%",
              background: "linear-gradient(94deg,#e3ff64 60%,#38bdf8 140%)",
              color: "#191d23",
              padding: "15px 0 13px 0",
              border: 0,
              borderRadius: 11,
              fontWeight: 900,
              fontSize: 19,
              marginTop: 3,
              boxShadow: "0 2px 22px #e3ff6436",
              letterSpacing: 0.3,
              cursor: "pointer",
              transition: "filter 0.13s, box-shadow 0.13s",
              filter: (!username || !password) ? "brightness(0.7)" : undefined,
              opacity: (!username || !password) ? 0.7 : 1,
            }}
            disabled={!username || !password}
          >
            Anmelden
          </button>

          {/* Error */}
          {error && (
            <div
              style={{
                color: "#f87171",
                background: "#1c1e21",
                border: "1px solid #a3e63522",
                marginTop: 18,
                fontWeight: 700,
                fontSize: 15,
                textAlign: "center",
                borderRadius: 8,
                padding: "10px 0",
                boxShadow: "0 1px 10px #f8717121",
                minHeight: 28,
              }}
            >
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }
}
