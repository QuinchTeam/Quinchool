"""Career profile tools.

Five operations cover every section rather than one tool per section per verb:
the section is an argument, so adding a section costs an enum value, not a new
tool. `target` addresses a single entry inside a list section, which is what
makes "delete one skill from one group" possible without a bespoke tool.
"""

from __future__ import annotations

from app.lib.tools.registry import Tool, registry

SECTIONS = (
    "personal",
    "educations",
    "skillGroups",
    "skills",
    "experiences",
    "projects",
)

LIST_SECTIONS = "educations | skillGroups | skills | experiences | projects"

_TARGET = (
    'object identifying one entry. Use {"match": "<text>"} to match on its name '
    '(institutionName, skill group label, company name, project name, or skill '
    'name), or {"index": <n>} for its position. For section "skills" also pass '
    '"group" with the skill group label.'
)

registry.register(
    Tool(
        name="career_profile.get",
        description=(
            "Read the user's stored career profile. Ask for only the sections "
            "the request needs; omit sections to read everything."
        ),
        arguments={
            "sections": f"optional array of: {' | '.join(SECTIONS)}",
        },
        examples=['{"sections": ["skillGroups"]}'],
    ),
    Tool(
        name="career_profile.update_personal",
        description=(
            "Change the profile's personal details. Send only the fields the "
            "user actually mentioned; the rest are left alone."
        ),
        arguments={
            "values": (
                "object with any of: name, email, contactNumber, linkedin, "
                "github, personalWebsite"
            ),
        },
        writes=True,
        examples=['{"values": {"name": "Cyril", "contactNumber": "0917..."}}'],
    ),
    Tool(
        name="career_profile.add_item",
        description="Add one entry to a list section of the profile.",
        arguments={
            "section": LIST_SECTIONS,
            "values": (
                "the new entry. educations: institutionName, location, degree, "
                "fieldOfStudy, specialization, startDate, endDate. skillGroups: "
                "label, skills[]. skills: group, name. experiences: jobTitle, "
                "companyName, location, employmentType, startDate, endDate, "
                "isCurrent, skills[], bullets[]. projects: projectName, "
                "startDate, endDate, isCurrent, skills[], bullets[]. Dates are "
                "YYYY-MM."
            ),
        },
        writes=True,
        examples=['{"section": "skills", "values": {"group": "Backend", "name": "NestJS"}}'],
    ),
    Tool(
        name="career_profile.update_item",
        description=(
            "Change one entry in a list section. Send only the fields that "
            "change; the rest of the entry is kept."
        ),
        arguments={
            "section": LIST_SECTIONS,
            "target": _TARGET,
            "values": "object with the fields to change",
        },
        writes=True,
        examples=[
            '{"section": "skillGroups", "target": {"match": "Backend"}, '
            '"values": {"label": "Backend & APIs"}}'
        ],
    ),
    Tool(
        name="career_profile.remove_item",
        description="Delete one entry from a list section.",
        arguments={
            "section": LIST_SECTIONS,
            "target": _TARGET,
        },
        writes=True,
        examples=[
            '{"section": "skills", "target": {"group": "Backend", "match": "NestJS"}}'
        ],
    ),
)
