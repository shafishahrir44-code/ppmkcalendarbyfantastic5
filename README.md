# PPMK Interactive Calendar 🗓️✨

### Never miss the good stuff.

Built for **HackPPMK25**, this collaborative calendar brings official PPMK events and student-organized hangouts together in one place. We started with a familiar problem: great events are easy to miss when details get buried in email. Now the whole community can find what's happening, share ideas, and make plans together.

[🚀 Try the live calendar](https://interactive-calendar-with-1755955705596.chatand.build/) · [📣 See our Devpost story](https://devpost.com/software/ppmk-collaborative-calendar)

## What you can do

- **Discover events:** Browse official PPMK activities and casual student meetups—from celebrations to futsal, jogging, and jam sessions.
- **Bring an idea to the calendar:** Students can request an event so the community can join in.
- **Keep things organized:** PPMK admins review requests, approve or decline them, and remove events when needed.
- **Ask the organizer:** Post questions on the site to clear up event details and connect with the people hosting it.

## How it came together

We built the calendar during the **HackPPMK25 hackathon** to make student events easier to find and easier to join. The project was developed with **ChatAndBuild** and **Claude Sonnet 4**, bringing together **React, TypeScript, HTML/CSS, SQL, and Supabase**.

## Run it locally

You'll need Node.js and a Supabase project.

1. Install dependencies: `npm install`
2. Create a `.env.local` file in the project root with your Supabase project settings:

   ```env
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

3. Start the development server: `npm run dev`

Other available scripts: `npm run build`, `npm run lint`, and `npm run preview`.

## What's next? 💡

Ideas from our Devpost roadmap include event categories and color tags, search, calendar export and sync, attendance, reminders, and interactive polls.

---

This is a fork of [foalif14/ppmkcalendarbyfantastic5](https://github.com/foalif14/ppmkcalendarbyfantastic5). See the [Devpost project](https://devpost.com/software/ppmk-collaborative-calendar) for the original story and team submission.
