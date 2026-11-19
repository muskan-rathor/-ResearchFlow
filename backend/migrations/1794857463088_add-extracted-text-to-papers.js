
export const up = (pgm) => {
  pgm.addColumn("papers", {
    extracted_text: {
      type: "TEXT",
    },
  });
};

export const down = (pgm) => {
  pgm.dropColumn("papers", "extracted_text");
};
