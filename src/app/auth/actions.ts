export type LoginActionState = {
  error?: string;
};

export async function loginAction(): Promise<LoginActionState> {
  return {
    error: "Correo o contraseña incorrectos.",
  };
}

export async function logoutAction() {
  return undefined;
}
