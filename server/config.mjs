import path from "node:path";

const DEFAULT_JOURNAL_PATH =
  "C:\\Users\\Dir.Vipisi\\Downloads\\deriv bots\\vipisi_journal_v4.csv";

export function getRuntimeConfig() {
  const journalPath = process.env.VIPISI_JOURNAL_PATH || DEFAULT_JOURNAL_PATH;

  return {
    port: Number(process.env.PORT || 4310),
    journalPath: path.normalize(journalPath),
    commands: [
      {
        label: "Start bot",
        command:
          "python C:\\Users\\Dir.Vipisi\\Downloads\\deriv bots\\run_vipisi.py"
      },
      {
        label: "Pause bot",
        command:
          "python C:\\Users\\Dir.Vipisi\\Downloads\\deriv bots\\stop_vipisi.py"
      },
      {
        label: "Open journal folder",
        command: "explorer \"C:\\Users\\Dir.Vipisi\\Downloads\\deriv bots\""
      }
    ]
  };
}
