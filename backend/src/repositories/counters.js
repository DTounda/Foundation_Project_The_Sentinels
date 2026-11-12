/**
 * Mongo creates text ids (_id). The API uses numbers (medicineId: 1, userId: 2...),
 * so each collection gets its next number from the "counters" collection.
 */
async function nextId(db, name) {
  const counter = await db
    .collection('counters')
    .findOneAndUpdate(
      { _id: name },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: 'after' },
    );
  return counter.seq;
}

module.exports = { nextId };
