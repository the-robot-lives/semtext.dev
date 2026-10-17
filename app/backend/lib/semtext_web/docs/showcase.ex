defmodule SemtextWeb.Docs.Showcase do
  @moduledoc """
  Showcase inventory + integrations list, ported verbatim from the Next
  site's `components/docs-shell.tsx`.

  One entry per showcase page (`/showcase/<slug>/`). The list feeds the
  docs-shell sidebar's Showcase group, the /showcase/ index and the /docs/
  sample list, so the three cannot drift — the Next site's invariant,
  carried over.
  """

  @type item :: %{
          required(:slug) => String.t() | nil,
          required(:label) => String.t(),
          required(:href) => String.t() | nil,
          required(:note) => String.t(),
          required(:planned) => boolean()
        }

  @doc "One entry per showcase page, in sidebar/display order."
  @spec items() :: [item()]
  def items do
    [
      %{
        slug: "claude-md",
        label: "CLAUDE.md",
        href: "/showcase/claude-md/",
        note: "repo guidance one file serves to an agent and to a human",
        planned: false
      },
      %{
        slug: "documentation",
        label: "Documentation",
        href: "/showcase/documentation/",
        note: "long-form docs with callouts, listings and citations",
        planned: false
      },
      %{
        slug: "onboarding",
        label: "Onboarding",
        href: "/showcase/onboarding/",
        note: "a checklist that tracks itself — steps, progress, facts",
        planned: false
      },
      %{
        slug: "agent",
        label: "Agent",
        href: "/showcase/agent/",
        note: "an agent record and the facts it answers from",
        planned: false
      },
      %{
        slug: "command",
        label: "Command",
        href: "/showcase/command/",
        note: "a command spec: arguments, steps, invariants",
        planned: false
      },
      %{
        slug: "skill",
        label: "Skill",
        href: "/showcase/skill/",
        note: "a skill file with tabbed reference and examples",
        planned: false
      },
      %{
        slug: "data-viewer",
        label: "Data viewer",
        href: "/showcase/data-viewer/",
        note: "sort and filter a table authored in the document",
        planned: false
      },
      %{
        slug: "embedding",
        label: "Embedding",
        href: "/showcase/embedding/",
        note: "reuse one document's sections inside another",
        planned: false
      },
      %{
        slug: "sem-shell",
        label: "sem-shell",
        href: "/showcase/sem-shell/",
        note: "the interactive terminal element over a virtual file system",
        planned: false
      }
    ]
  end

  @doc """
  The four live portfolio origins whose SemText hookups are planned —
  same array the landing showcase menu uses (per the Next site's
  no-drift rule). Statuses verified 2026-10-13 upstream (all four origins
  serve 200).
  """
  @spec integrations() :: [item()]
  def integrations do
    [
      %{
        slug: nil,
        label: "The Robot Learns",
        href: "https://therobotlearns.com",
        note:
          "live app; courses as SemText with per-user quiz tracking is the planned add-on",
        planned: true
      },
      %{
        slug: nil,
        label: "The Robot Plans",
        href: "https://therobotplans.com",
        note:
          "live app; issue submission into Jira, ClickUp or GitHub is the planned add-on",
        planned: true
      },
      %{
        slug: nil,
        label: "The Robot Knows",
        href: "https://therobotknows.com",
        note: "live app; the knowledge-base hookup is the planned add-on",
        planned: true
      },
      %{
        slug: nil,
        label: "Draftamo",
        href: "https://draftamo.com",
        note:
          "live app; mockups and UML renders from hosted projects or local XML is the planned add-on",
        planned: true
      }
    ]
  end

  @doc "Showcase item by slug (nil when unknown)."
  @spec by_slug(String.t()) :: item() | nil
  def by_slug(slug), do: Enum.find(items(), &(&1.slug == slug))
end
