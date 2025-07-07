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
          background: "#18181b",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Inter',sans-serif",
        }}
      >
        <div
          style={{
            background: "#23262e",
            borderRadius: 18,
            boxShadow: "0 2px 16px #0007",
            padding: 40,
            minWidth: 330,
          }}
        >
          <h2
            style={{
              color: "#fff",
              fontSize: 26,
              fontWeight: 800,
              marginBottom: 16,
              letterSpacing: 1,
              textAlign: "center",
            }}
          >
            Login
          </h2>
          <input
            type="text"
            placeholder="Benutzername"
            value={username}
            onChange={(e) => this.setState({ username: e.target.value })}
            list="usernames"
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 8,
              border: 0,
              fontSize: 17,
              background: "#18181b",
              color: "#fff",
              marginBottom: 8,
            }}
            onKeyDown={(e) => e.key === "Enter" && this.handleLogin()}
            autoFocus
          />
          <datalist id="usernames">
            {users.map((u) => (
              <option key={u.id} value={u.username} />
            ))}
          </datalist>
          <input
            type="password"
            placeholder="Passwort"
            value={password}
            onChange={(e) => this.setState({ password: e.target.value })}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 8,
              border: 0,
              fontSize: 17,
              background: "#18181b",
              color: "#fff",
              marginBottom: 12,
            }}
            onKeyDown={(e) => e.key === "Enter" && this.handleLogin()}
          />
          <button
            onClick={this.handleLogin}
            style={{
              width: "100%",
              background: "#a3e635",
              color: "#18181b",
              padding: "12px 0",
              border: 0,
              borderRadius: 8,
              fontWeight: 900,
              fontSize: 19,
              cursor: "pointer",
            }}
          >
            Anmelden
          </button>
          {error && (
            <div
              style={{ color: "#f87171", marginTop: 15, textAlign: "center" }}
            >
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }
}
