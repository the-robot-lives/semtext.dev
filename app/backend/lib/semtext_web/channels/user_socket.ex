defmodule SemtextWeb.UserSocket do
  use Phoenix.Socket

  channel "org:*", SemtextWeb.OrgChannel

  @impl true
  # <REMOVED UUID HERE> connect :: auto-generated pointer for public function connect
  def connect(%{"token" => token}, socket, _connect_info) do
    case Semtext.Guardian.decode_and_verify(token, %{"typ" => "access"}) do
      {:ok, claims} ->
        case Semtext.Guardian.resource_from_claims(claims) do
          {:ok, session} ->
            user_id =
              case session.user do
                {:ref, _, id} -> id
                %{id: id} -> id
              end

            # Invite gate (Semtext.Auth.InviteGate): a gated account gets no
            # realtime channel until it redeems an invite / confirms its email.
            if Semtext.Auth.InviteGate.required?(user_id),
              do: {:error, %{reason: "invite_required"}},
              else: {:ok, assign(socket, :user_id, user_id)}

          {:error, _} ->
            :error
        end

      {:error, _} ->
        :error
    end
  end

  def connect(_params, _socket, _connect_info), do: :error

  @impl true
  # <REMOVED UUID HERE> id :: auto-generated pointer for public function id
  def id(socket), do: "user_socket:#{socket.assigns.user_id}"
end
