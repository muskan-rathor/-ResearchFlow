
export const shorthands = undefined;

export const up = (pgm) => {
  pgm.addColumn("paper_analyses", {
    key_findings: {
      type: "text"
    }
  });
};

export const down = (pgm) => {
  pgm.dropColumn("paper_analyses", "key_findings");
};
