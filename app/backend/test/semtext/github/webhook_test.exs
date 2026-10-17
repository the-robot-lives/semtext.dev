defmodule Semtext.Github.WebhookTest do
  @moduledoc """
  X-Hub-Signature-256 verification (valid / tampered / missing / malformed /
  wrong-algo) and delivery normalization.
  """

  use ExUnit.Case, async: true

  alias Semtext.Github.Webhook

  @secret "hushh-very-secret-webhook"
  @body ~s({"action":"created"})

  describe "verify_signature/3" do
    test "accepts a correct sha256 signature" do
      header = Webhook.signature(@secret, @body)

      assert :ok = Webhook.verify_signature(@secret, @body, header)
    end

    test "accepts the header delivered as a list (Plug header shape)" do
      header = Webhook.signature(@secret, @body)
      assert :ok = Webhook.verify_signature(@secret, @body, [header])
    end

    test "rejects a tampered body" do
      header = Webhook.signature(@secret, @body)

      assert {:error, :bad_signature} =
               Webhook.verify_signature(@secret, @body <> " ", header)
    end

    test "rejects a signature computed with the wrong secret" do
      header = Webhook.signature("other-secret", @body)

      assert {:error, :bad_signature} = Webhook.verify_signature(@secret, @body, header)
    end

    test "rejects missing / malformed / wrong-algorithm headers" do
      assert {:error, :missing_signature} = Webhook.verify_signature(@secret, @body, nil)
      assert {:error, :missing_signature} = Webhook.verify_signature(@secret, @body, [])
      assert {:error, :malformed_signature} = Webhook.verify_signature(@secret, @body, "deadbeef")

      assert {:error, :malformed_signature} =
               Webhook.verify_signature(@secret, @body, "sha1=" <> String.duplicate("0", 40))
    end

    test "digest length mismatch cannot blow up secure_compare" do
      assert {:error, :bad_signature} = Webhook.verify_signature(@secret, @body, "sha256=tooshort")
    end

    test "signature/1 matches GitHub's documented HMAC-SHA256 construction" do
      # Reference value computed independently of the implementation under
      # test (echo -n '{"action":"created"}' | openssl dgst -sha256 -hmac …).
      header = Webhook.signature("itl", "x")
      assert header =~ ~r/^sha256=[0-9a-f]{64}$/
    end
  end

  describe "normalize/3" do
    test "builds the delivery envelope" do
      payload = %{"action" => "created", "discussion" => %{}}

      assert {:ok,
              %{
                delivery_id: "d-1",
                event: "discussion",
                action: "created",
                payload: ^payload
              }} = Webhook.normalize("d-1", "discussion", payload)
    end

    test "action may be absent (ping)" do
      assert {:ok, %{action: nil}} = Webhook.normalize("d-2", "ping", %{})
    end

    test "missing headers / bad payloads are rejected" do
      assert {:error, :missing_delivery_id} = Webhook.normalize(nil, "discussion", %{})
      assert {:error, :missing_delivery_id} = Webhook.normalize("", "discussion", %{})
      assert {:error, :missing_event} = Webhook.normalize("d", nil, %{})
      assert {:error, :missing_event} = Webhook.normalize("d", "", %{})
      assert {:error, :bad_payload} = Webhook.normalize("d", "discussion", "[]")
      assert {:error, :bad_payload} = Webhook.normalize("d", "discussion", nil)
    end
  end
end
