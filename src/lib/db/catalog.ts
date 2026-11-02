// Source of truth for the problem catalog. It is loaded into the local SQLite
// database on first run (see seed.ts). Problem statements stay on LeetCode; we only keep
// slug, title, difficulty and a NeetCode-style topic.
//
// Problems outside NeetCode 150 (from Blind 75, Grind 75 and Top Interview
// 150) have a topic assigned by hand; those are marked in the section below.

export const TOPICS = [
  { slug: "arrays-hashing", name: "Arrays & Hashing" },
  { slug: "two-pointers", name: "Two Pointers" },
  { slug: "sliding-window", name: "Sliding Window" },
  { slug: "stack", name: "Stack" },
  { slug: "binary-search", name: "Binary Search" },
  { slug: "linked-list", name: "Linked List" },
  { slug: "trees", name: "Trees" },
  { slug: "tries", name: "Tries" },
  { slug: "heap", name: "Heap / Priority Queue" },
  { slug: "backtracking", name: "Backtracking" },
  { slug: "graphs", name: "Graphs" },
  { slug: "advanced-graphs", name: "Advanced Graphs" },
  { slug: "dp-1d", name: "1-D Dynamic Programming" },
  { slug: "dp-2d", name: "2-D Dynamic Programming" },
  { slug: "greedy", name: "Greedy" },
  { slug: "intervals", name: "Intervals" },
  { slug: "math-geometry", name: "Math & Geometry" },
  { slug: "bit-manipulation", name: "Bit Manipulation" },
] as const;

export type TopicSlug = (typeof TOPICS)[number]["slug"];
export type Difficulty = "easy" | "medium" | "hard";
type Row = readonly [slug: string, title: string, difficulty: Difficulty, topic: TopicSlug];

// NeetCode 150, in neetcode.io roadmap order.
const NEETCODE_150_PROBLEMS: Row[] = [
  ["contains-duplicate", "Contains Duplicate", "easy", "arrays-hashing"],
  ["valid-anagram", "Valid Anagram", "easy", "arrays-hashing"],
  ["two-sum", "Two Sum", "easy", "arrays-hashing"],
  ["group-anagrams", "Group Anagrams", "medium", "arrays-hashing"],
  ["top-k-frequent-elements", "Top K Frequent Elements", "medium", "arrays-hashing"],
  ["encode-and-decode-strings", "Encode and Decode Strings", "medium", "arrays-hashing"],
  ["product-of-array-except-self", "Product of Array Except Self", "medium", "arrays-hashing"],
  ["valid-sudoku", "Valid Sudoku", "medium", "arrays-hashing"],
  ["longest-consecutive-sequence", "Longest Consecutive Sequence", "medium", "arrays-hashing"],

  ["valid-palindrome", "Valid Palindrome", "easy", "two-pointers"],
  ["two-sum-ii-input-array-is-sorted", "Two Sum II - Input Array Is Sorted", "medium", "two-pointers"],
  ["3sum", "3Sum", "medium", "two-pointers"],
  ["container-with-most-water", "Container With Most Water", "medium", "two-pointers"],
  ["trapping-rain-water", "Trapping Rain Water", "hard", "two-pointers"],

  ["best-time-to-buy-and-sell-stock", "Best Time to Buy and Sell Stock", "easy", "sliding-window"],
  ["longest-substring-without-repeating-characters", "Longest Substring Without Repeating Characters", "medium", "sliding-window"],
  ["longest-repeating-character-replacement", "Longest Repeating Character Replacement", "medium", "sliding-window"],
  ["permutation-in-string", "Permutation in String", "medium", "sliding-window"],
  ["minimum-window-substring", "Minimum Window Substring", "hard", "sliding-window"],
  ["sliding-window-maximum", "Sliding Window Maximum", "hard", "sliding-window"],

  ["valid-parentheses", "Valid Parentheses", "easy", "stack"],
  ["min-stack", "Min Stack", "medium", "stack"],
  ["evaluate-reverse-polish-notation", "Evaluate Reverse Polish Notation", "medium", "stack"],
  ["generate-parentheses", "Generate Parentheses", "medium", "stack"],
  ["daily-temperatures", "Daily Temperatures", "medium", "stack"],
  ["car-fleet", "Car Fleet", "medium", "stack"],
  ["largest-rectangle-in-histogram", "Largest Rectangle in Histogram", "hard", "stack"],

  ["binary-search", "Binary Search", "easy", "binary-search"],
  ["search-a-2d-matrix", "Search a 2D Matrix", "medium", "binary-search"],
  ["koko-eating-bananas", "Koko Eating Bananas", "medium", "binary-search"],
  ["find-minimum-in-rotated-sorted-array", "Find Minimum in Rotated Sorted Array", "medium", "binary-search"],
  ["search-in-rotated-sorted-array", "Search in Rotated Sorted Array", "medium", "binary-search"],
  ["time-based-key-value-store", "Time Based Key-Value Store", "medium", "binary-search"],
  ["median-of-two-sorted-arrays", "Median of Two Sorted Arrays", "hard", "binary-search"],

  ["reverse-linked-list", "Reverse Linked List", "easy", "linked-list"],
  ["merge-two-sorted-lists", "Merge Two Sorted Lists", "easy", "linked-list"],
  ["linked-list-cycle", "Linked List Cycle", "easy", "linked-list"],
  ["reorder-list", "Reorder List", "medium", "linked-list"],
  ["remove-nth-node-from-end-of-list", "Remove Nth Node From End of List", "medium", "linked-list"],
  ["copy-list-with-random-pointer", "Copy List with Random Pointer", "medium", "linked-list"],
  ["add-two-numbers", "Add Two Numbers", "medium", "linked-list"],
  ["find-the-duplicate-number", "Find the Duplicate Number", "medium", "linked-list"],
  ["lru-cache", "LRU Cache", "medium", "linked-list"],
  ["merge-k-sorted-lists", "Merge k Sorted Lists", "hard", "linked-list"],
  ["reverse-nodes-in-k-group", "Reverse Nodes in k-Group", "hard", "linked-list"],

  ["invert-binary-tree", "Invert Binary Tree", "easy", "trees"],
  ["maximum-depth-of-binary-tree", "Maximum Depth of Binary Tree", "easy", "trees"],
  ["diameter-of-binary-tree", "Diameter of Binary Tree", "easy", "trees"],
  ["balanced-binary-tree", "Balanced Binary Tree", "easy", "trees"],
  ["same-tree", "Same Tree", "easy", "trees"],
  ["subtree-of-another-tree", "Subtree of Another Tree", "easy", "trees"],
  ["lowest-common-ancestor-of-a-binary-search-tree", "Lowest Common Ancestor of a Binary Search Tree", "medium", "trees"],
  ["binary-tree-level-order-traversal", "Binary Tree Level Order Traversal", "medium", "trees"],
  ["binary-tree-right-side-view", "Binary Tree Right Side View", "medium", "trees"],
  ["count-good-nodes-in-binary-tree", "Count Good Nodes in Binary Tree", "medium", "trees"],
  ["validate-binary-search-tree", "Validate Binary Search Tree", "medium", "trees"],
  ["kth-smallest-element-in-a-bst", "Kth Smallest Element in a BST", "medium", "trees"],
  ["construct-binary-tree-from-preorder-and-inorder-traversal", "Construct Binary Tree from Preorder and Inorder Traversal", "medium", "trees"],
  ["binary-tree-maximum-path-sum", "Binary Tree Maximum Path Sum", "hard", "trees"],
  ["serialize-and-deserialize-binary-tree", "Serialize and Deserialize Binary Tree", "hard", "trees"],

  ["implement-trie-prefix-tree", "Implement Trie (Prefix Tree)", "medium", "tries"],
  ["design-add-and-search-words-data-structure", "Design Add and Search Words Data Structure", "medium", "tries"],
  ["word-search-ii", "Word Search II", "hard", "tries"],

  ["kth-largest-element-in-a-stream", "Kth Largest Element in a Stream", "easy", "heap"],
  ["last-stone-weight", "Last Stone Weight", "easy", "heap"],
  ["k-closest-points-to-origin", "K Closest Points to Origin", "medium", "heap"],
  ["kth-largest-element-in-an-array", "Kth Largest Element in an Array", "medium", "heap"],
  ["task-scheduler", "Task Scheduler", "medium", "heap"],
  ["design-twitter", "Design Twitter", "medium", "heap"],
  ["find-median-from-data-stream", "Find Median from Data Stream", "hard", "heap"],

  ["subsets", "Subsets", "medium", "backtracking"],
  ["combination-sum", "Combination Sum", "medium", "backtracking"],
  ["permutations", "Permutations", "medium", "backtracking"],
  ["subsets-ii", "Subsets II", "medium", "backtracking"],
  ["combination-sum-ii", "Combination Sum II", "medium", "backtracking"],
  ["word-search", "Word Search", "medium", "backtracking"],
  ["palindrome-partitioning", "Palindrome Partitioning", "medium", "backtracking"],
  ["letter-combinations-of-a-phone-number", "Letter Combinations of a Phone Number", "medium", "backtracking"],
  ["n-queens", "N-Queens", "hard", "backtracking"],

  ["number-of-islands", "Number of Islands", "medium", "graphs"],
  ["max-area-of-island", "Max Area of Island", "medium", "graphs"],
  ["clone-graph", "Clone Graph", "medium", "graphs"],
  ["walls-and-gates", "Walls and Gates", "medium", "graphs"],
  ["rotting-oranges", "Rotting Oranges", "medium", "graphs"],
  ["pacific-atlantic-water-flow", "Pacific Atlantic Water Flow", "medium", "graphs"],
  ["surrounded-regions", "Surrounded Regions", "medium", "graphs"],
  ["course-schedule", "Course Schedule", "medium", "graphs"],
  ["course-schedule-ii", "Course Schedule II", "medium", "graphs"],
  ["graph-valid-tree", "Graph Valid Tree", "medium", "graphs"],
  ["number-of-connected-components-in-an-undirected-graph", "Number of Connected Components in an Undirected Graph", "medium", "graphs"],
  ["redundant-connection", "Redundant Connection", "medium", "graphs"],
  ["word-ladder", "Word Ladder", "hard", "graphs"],

  ["reconstruct-itinerary", "Reconstruct Itinerary", "hard", "advanced-graphs"],
  ["min-cost-to-connect-all-points", "Min Cost to Connect All Points", "medium", "advanced-graphs"],
  ["network-delay-time", "Network Delay Time", "medium", "advanced-graphs"],
  ["swim-in-rising-water", "Swim in Rising Water", "hard", "advanced-graphs"],
  ["alien-dictionary", "Alien Dictionary", "hard", "advanced-graphs"],
  ["cheapest-flights-within-k-stops", "Cheapest Flights Within K Stops", "medium", "advanced-graphs"],

  ["climbing-stairs", "Climbing Stairs", "easy", "dp-1d"],
  ["min-cost-climbing-stairs", "Min Cost Climbing Stairs", "easy", "dp-1d"],
  ["house-robber", "House Robber", "medium", "dp-1d"],
  ["house-robber-ii", "House Robber II", "medium", "dp-1d"],
  ["longest-palindromic-substring", "Longest Palindromic Substring", "medium", "dp-1d"],
  ["palindromic-substrings", "Palindromic Substrings", "medium", "dp-1d"],
  ["decode-ways", "Decode Ways", "medium", "dp-1d"],
  ["coin-change", "Coin Change", "medium", "dp-1d"],
  ["maximum-product-subarray", "Maximum Product Subarray", "medium", "dp-1d"],
  ["word-break", "Word Break", "medium", "dp-1d"],
  ["longest-increasing-subsequence", "Longest Increasing Subsequence", "medium", "dp-1d"],
  ["partition-equal-subset-sum", "Partition Equal Subset Sum", "medium", "dp-1d"],

  ["unique-paths", "Unique Paths", "medium", "dp-2d"],
  ["longest-common-subsequence", "Longest Common Subsequence", "medium", "dp-2d"],
  ["best-time-to-buy-and-sell-stock-with-cooldown", "Best Time to Buy and Sell Stock with Cooldown", "medium", "dp-2d"],
  ["coin-change-ii", "Coin Change II", "medium", "dp-2d"],
  ["target-sum", "Target Sum", "medium", "dp-2d"],
  ["interleaving-string", "Interleaving String", "medium", "dp-2d"],
  ["longest-increasing-path-in-a-matrix", "Longest Increasing Path in a Matrix", "hard", "dp-2d"],
  ["distinct-subsequences", "Distinct Subsequences", "hard", "dp-2d"],
  ["edit-distance", "Edit Distance", "medium", "dp-2d"],
  ["burst-balloons", "Burst Balloons", "hard", "dp-2d"],
  ["regular-expression-matching", "Regular Expression Matching", "hard", "dp-2d"],

  ["maximum-subarray", "Maximum Subarray", "medium", "greedy"],
  ["jump-game", "Jump Game", "medium", "greedy"],
  ["jump-game-ii", "Jump Game II", "medium", "greedy"],
  ["gas-station", "Gas Station", "medium", "greedy"],
  ["hand-of-straights", "Hand of Straights", "medium", "greedy"],
  ["merge-triplets-to-form-target-triplet", "Merge Triplets to Form Target Triplet", "medium", "greedy"],
  ["partition-labels", "Partition Labels", "medium", "greedy"],
  ["valid-parenthesis-string", "Valid Parenthesis String", "medium", "greedy"],

  ["insert-interval", "Insert Interval", "medium", "intervals"],
  ["merge-intervals", "Merge Intervals", "medium", "intervals"],
  ["non-overlapping-intervals", "Non-overlapping Intervals", "medium", "intervals"],
  ["meeting-rooms", "Meeting Rooms", "easy", "intervals"],
  ["meeting-rooms-ii", "Meeting Rooms II", "medium", "intervals"],
  ["minimum-interval-to-include-each-query", "Minimum Interval to Include Each Query", "hard", "intervals"],

  ["rotate-image", "Rotate Image", "medium", "math-geometry"],
  ["spiral-matrix", "Spiral Matrix", "medium", "math-geometry"],
  ["set-matrix-zeroes", "Set Matrix Zeroes", "medium", "math-geometry"],
  ["happy-number", "Happy Number", "easy", "math-geometry"],
  ["plus-one", "Plus One", "easy", "math-geometry"],
  ["powx-n", "Pow(x, n)", "medium", "math-geometry"],
  ["multiply-strings", "Multiply Strings", "medium", "math-geometry"],
  ["detect-squares", "Detect Squares", "medium", "math-geometry"],

  ["single-number", "Single Number", "easy", "bit-manipulation"],
  ["number-of-1-bits", "Number of 1 Bits", "easy", "bit-manipulation"],
  ["counting-bits", "Counting Bits", "easy", "bit-manipulation"],
  ["reverse-bits", "Reverse Bits", "easy", "bit-manipulation"],
  ["missing-number", "Missing Number", "easy", "bit-manipulation"],
  ["sum-of-two-integers", "Sum of Two Integers", "medium", "bit-manipulation"],
  ["reverse-integer", "Reverse Integer", "medium", "bit-manipulation"],
];

// Not in NeetCode 150: topic assigned by hand (plan §4.7).
const HAND_TOPICED_PROBLEMS: Row[] = [
  // Blind 75
  ["combination-sum-iv", "Combination Sum IV", "medium", "dp-1d"],

  // Grind 75
  ["flood-fill", "Flood Fill", "easy", "graphs"],
  ["implement-queue-using-stacks", "Implement Queue using Stacks", "easy", "stack"],
  ["first-bad-version", "First Bad Version", "easy", "binary-search"],
  ["ransom-note", "Ransom Note", "easy", "arrays-hashing"],
  ["longest-palindrome", "Longest Palindrome", "easy", "arrays-hashing"],
  ["majority-element", "Majority Element", "easy", "arrays-hashing"],
  ["add-binary", "Add Binary", "easy", "bit-manipulation"],
  ["middle-of-the-linked-list", "Middle of the Linked List", "easy", "linked-list"],
  ["01-matrix", "01 Matrix", "medium", "graphs"],
  ["lowest-common-ancestor-of-a-binary-tree", "Lowest Common Ancestor of a Binary Tree", "medium", "trees"],
  ["accounts-merge", "Accounts Merge", "medium", "graphs"],
  ["sort-colors", "Sort Colors", "medium", "two-pointers"],
  ["string-to-integer-atoi", "String to Integer (atoi)", "medium", "math-geometry"],
  ["find-all-anagrams-in-a-string", "Find All Anagrams in a String", "medium", "sliding-window"],
  ["minimum-height-trees", "Minimum Height Trees", "medium", "graphs"],
  ["basic-calculator", "Basic Calculator", "hard", "stack"],
  ["maximum-profit-in-job-scheduling", "Maximum Profit in Job Scheduling", "hard", "dp-1d"],

  // Top Interview 150
  ["merge-sorted-array", "Merge Sorted Array", "easy", "two-pointers"],
  ["remove-element", "Remove Element", "easy", "two-pointers"],
  ["remove-duplicates-from-sorted-array", "Remove Duplicates from Sorted Array", "easy", "two-pointers"],
  ["remove-duplicates-from-sorted-array-ii", "Remove Duplicates from Sorted Array II", "medium", "two-pointers"],
  ["rotate-array", "Rotate Array", "medium", "arrays-hashing"],
  ["best-time-to-buy-and-sell-stock-ii", "Best Time to Buy and Sell Stock II", "medium", "greedy"],
  ["h-index", "H-Index", "medium", "arrays-hashing"],
  ["insert-delete-getrandom-o1", "Insert Delete GetRandom O(1)", "medium", "arrays-hashing"],
  ["candy", "Candy", "hard", "greedy"],
  ["roman-to-integer", "Roman to Integer", "easy", "math-geometry"],
  ["integer-to-roman", "Integer to Roman", "medium", "math-geometry"],
  ["length-of-last-word", "Length of Last Word", "easy", "arrays-hashing"],
  ["longest-common-prefix", "Longest Common Prefix", "easy", "arrays-hashing"],
  ["reverse-words-in-a-string", "Reverse Words in a String", "medium", "two-pointers"],
  ["zigzag-conversion", "Zigzag Conversion", "medium", "arrays-hashing"],
  ["find-the-index-of-the-first-occurrence-in-a-string", "Find the Index of the First Occurrence in a String", "easy", "two-pointers"],
  ["text-justification", "Text Justification", "hard", "arrays-hashing"],
  ["is-subsequence", "Is Subsequence", "easy", "two-pointers"],
  ["minimum-size-subarray-sum", "Minimum Size Subarray Sum", "medium", "sliding-window"],
  ["substring-with-concatenation-of-all-words", "Substring with Concatenation of All Words", "hard", "sliding-window"],
  ["game-of-life", "Game of Life", "medium", "math-geometry"],
  ["isomorphic-strings", "Isomorphic Strings", "easy", "arrays-hashing"],
  ["word-pattern", "Word Pattern", "easy", "arrays-hashing"],
  ["contains-duplicate-ii", "Contains Duplicate II", "easy", "sliding-window"],
  ["summary-ranges", "Summary Ranges", "easy", "intervals"],
  ["minimum-number-of-arrows-to-burst-balloons", "Minimum Number of Arrows to Burst Balloons", "medium", "intervals"],
  ["simplify-path", "Simplify Path", "medium", "stack"],
  ["reverse-linked-list-ii", "Reverse Linked List II", "medium", "linked-list"],
  ["remove-duplicates-from-sorted-list-ii", "Remove Duplicates from Sorted List II", "medium", "linked-list"],
  ["rotate-list", "Rotate List", "medium", "linked-list"],
  ["partition-list", "Partition List", "medium", "linked-list"],
  ["symmetric-tree", "Symmetric Tree", "easy", "trees"],
  ["construct-binary-tree-from-inorder-and-postorder-traversal", "Construct Binary Tree from Inorder and Postorder Traversal", "medium", "trees"],
  ["populating-next-right-pointers-in-each-node-ii", "Populating Next Right Pointers in Each Node II", "medium", "trees"],
  ["flatten-binary-tree-to-linked-list", "Flatten Binary Tree to Linked List", "medium", "trees"],
  ["path-sum", "Path Sum", "easy", "trees"],
  ["sum-root-to-leaf-numbers", "Sum Root to Leaf Numbers", "medium", "trees"],
  ["binary-search-tree-iterator", "Binary Search Tree Iterator", "medium", "trees"],
  ["count-complete-tree-nodes", "Count Complete Tree Nodes", "easy", "trees"],
  ["average-of-levels-in-binary-tree", "Average of Levels in Binary Tree", "easy", "trees"],
  ["binary-tree-zigzag-level-order-traversal", "Binary Tree Zigzag Level Order Traversal", "medium", "trees"],
  ["minimum-absolute-difference-in-bst", "Minimum Absolute Difference in BST", "easy", "trees"],
  ["convert-sorted-array-to-binary-search-tree", "Convert Sorted Array to Binary Search Tree", "easy", "trees"],
  ["construct-quad-tree", "Construct Quad Tree", "medium", "trees"],
  ["evaluate-division", "Evaluate Division", "medium", "graphs"],
  ["snakes-and-ladders", "Snakes and Ladders", "medium", "graphs"],
  ["minimum-genetic-mutation", "Minimum Genetic Mutation", "medium", "graphs"],
  ["combinations", "Combinations", "medium", "backtracking"],
  ["n-queens-ii", "N-Queens II", "hard", "backtracking"],
  ["sort-list", "Sort List", "medium", "linked-list"],
  ["maximum-sum-circular-subarray", "Maximum Sum Circular Subarray", "medium", "greedy"],
  ["search-insert-position", "Search Insert Position", "easy", "binary-search"],
  ["find-peak-element", "Find Peak Element", "medium", "binary-search"],
  ["find-first-and-last-position-of-element-in-sorted-array", "Find First and Last Position of Element in Sorted Array", "medium", "binary-search"],
  ["sqrtx", "Sqrt(x)", "easy", "binary-search"],
  ["ipo", "IPO", "hard", "heap"],
  ["find-k-pairs-with-smallest-sums", "Find K Pairs with Smallest Sums", "medium", "heap"],
  ["single-number-ii", "Single Number II", "medium", "bit-manipulation"],
  ["bitwise-and-of-numbers-range", "Bitwise AND of Numbers Range", "medium", "bit-manipulation"],
  ["palindrome-number", "Palindrome Number", "easy", "math-geometry"],
  ["factorial-trailing-zeroes", "Factorial Trailing Zeroes", "medium", "math-geometry"],
  ["max-points-on-a-line", "Max Points on a Line", "hard", "math-geometry"],
  ["triangle", "Triangle", "medium", "dp-2d"],
  ["minimum-path-sum", "Minimum Path Sum", "medium", "dp-2d"],
  ["unique-paths-ii", "Unique Paths II", "medium", "dp-2d"],
  ["best-time-to-buy-and-sell-stock-iii", "Best Time to Buy and Sell Stock III", "hard", "dp-2d"],
  ["best-time-to-buy-and-sell-stock-iv", "Best Time to Buy and Sell Stock IV", "hard", "dp-2d"],
  ["maximal-square", "Maximal Square", "medium", "dp-2d"],
];

export const PROBLEMS = [...NEETCODE_150_PROBLEMS, ...HAND_TOPICED_PROBLEMS].map(
  ([slug, title, difficulty, topic]) => ({ slug, title, difficulty, topic }),
);

export type CatalogList = {
  slug: string;
  name: string;
  description: string;
  size: number;
  problems: string[];
};

export const LISTS: CatalogList[] = [
  {
    slug: "blind-75",
    name: "Blind 75",
    description: "The original 75 essential interview problems, grouped by category.",
    size: 75,
    problems: [
      // Array
      "two-sum", "best-time-to-buy-and-sell-stock", "contains-duplicate",
      "product-of-array-except-self", "maximum-subarray", "maximum-product-subarray",
      "find-minimum-in-rotated-sorted-array", "search-in-rotated-sorted-array", "3sum",
      "container-with-most-water",
      // Binary
      "sum-of-two-integers", "number-of-1-bits", "counting-bits", "missing-number", "reverse-bits",
      // Dynamic programming
      "climbing-stairs", "coin-change", "longest-increasing-subsequence",
      "longest-common-subsequence", "word-break", "combination-sum-iv", "house-robber",
      "house-robber-ii", "decode-ways", "unique-paths", "jump-game",
      // Graph
      "clone-graph", "course-schedule", "pacific-atlantic-water-flow", "number-of-islands",
      "longest-consecutive-sequence", "alien-dictionary", "graph-valid-tree",
      "number-of-connected-components-in-an-undirected-graph",
      // Interval
      "insert-interval", "merge-intervals", "non-overlapping-intervals", "meeting-rooms",
      "meeting-rooms-ii",
      // Linked list
      "reverse-linked-list", "linked-list-cycle", "merge-two-sorted-lists", "merge-k-sorted-lists",
      "remove-nth-node-from-end-of-list", "reorder-list",
      // Matrix
      "set-matrix-zeroes", "spiral-matrix", "rotate-image", "word-search",
      // String
      "longest-substring-without-repeating-characters", "longest-repeating-character-replacement",
      "minimum-window-substring", "valid-anagram", "group-anagrams", "valid-parentheses",
      "valid-palindrome", "longest-palindromic-substring", "palindromic-substrings",
      "encode-and-decode-strings",
      // Tree
      "maximum-depth-of-binary-tree", "same-tree", "invert-binary-tree",
      "binary-tree-maximum-path-sum", "binary-tree-level-order-traversal",
      "serialize-and-deserialize-binary-tree", "subtree-of-another-tree",
      "construct-binary-tree-from-preorder-and-inorder-traversal", "validate-binary-search-tree",
      "kth-smallest-element-in-a-bst", "lowest-common-ancestor-of-a-binary-search-tree",
      "implement-trie-prefix-tree", "design-add-and-search-words-data-structure", "word-search-ii",
      // Heap
      "top-k-frequent-elements", "find-median-from-data-stream",
    ],
  },
  {
    slug: "neetcode-150",
    name: "NeetCode 150",
    description: "Blind 75 expanded to 150 problems, ordered by pattern.",
    size: 150,
    problems: NEETCODE_150_PROBLEMS.map(([slug]) => slug),
  },
  {
    slug: "grind-75",
    name: "Grind 75",
    description: "The default 8-week Grind 75 plan, easiest weeks first.",
    size: 75,
    problems: [
      // Week 1
      "two-sum", "valid-parentheses", "merge-two-sorted-lists", "best-time-to-buy-and-sell-stock",
      "valid-palindrome", "invert-binary-tree", "valid-anagram", "binary-search", "flood-fill",
      "lowest-common-ancestor-of-a-binary-search-tree", "balanced-binary-tree",
      "linked-list-cycle", "implement-queue-using-stacks",
      // Week 2
      "first-bad-version", "ransom-note", "climbing-stairs", "longest-palindrome",
      "reverse-linked-list", "majority-element", "add-binary", "diameter-of-binary-tree",
      "middle-of-the-linked-list", "maximum-depth-of-binary-tree", "contains-duplicate",
      "maximum-subarray",
      // Week 3
      "insert-interval", "01-matrix", "k-closest-points-to-origin",
      "longest-substring-without-repeating-characters", "3sum",
      "binary-tree-level-order-traversal", "clone-graph", "evaluate-reverse-polish-notation",
      // Week 4
      "course-schedule", "implement-trie-prefix-tree", "coin-change",
      "product-of-array-except-self", "min-stack", "validate-binary-search-tree",
      "number-of-islands", "rotting-oranges",
      // Week 5
      "search-in-rotated-sorted-array", "combination-sum", "permutations", "merge-intervals",
      "lowest-common-ancestor-of-a-binary-tree", "time-based-key-value-store", "accounts-merge",
      "sort-colors",
      // Week 6
      "word-break", "partition-equal-subset-sum", "string-to-integer-atoi", "spiral-matrix",
      "subsets", "binary-tree-right-side-view", "longest-palindromic-substring", "unique-paths",
      "construct-binary-tree-from-preorder-and-inorder-traversal",
      // Week 7
      "container-with-most-water", "letter-combinations-of-a-phone-number", "word-search",
      "find-all-anagrams-in-a-string", "minimum-height-trees", "task-scheduler", "lru-cache",
      "kth-smallest-element-in-a-bst",
      // Week 8
      "minimum-window-substring", "serialize-and-deserialize-binary-tree", "trapping-rain-water",
      "find-median-from-data-stream", "word-ladder", "basic-calculator",
      "maximum-profit-in-job-scheduling", "merge-k-sorted-lists", "largest-rectangle-in-histogram",
    ],
  },
  {
    slug: "top-interview-150",
    name: "Top Interview 150",
    description: "LeetCode's own study plan of 150 classic interview questions.",
    size: 150,
    problems: [
      // Array / String
      "merge-sorted-array", "remove-element", "remove-duplicates-from-sorted-array",
      "remove-duplicates-from-sorted-array-ii", "majority-element", "rotate-array",
      "best-time-to-buy-and-sell-stock", "best-time-to-buy-and-sell-stock-ii", "jump-game",
      "jump-game-ii", "h-index", "insert-delete-getrandom-o1", "product-of-array-except-self",
      "gas-station", "candy", "trapping-rain-water", "roman-to-integer", "integer-to-roman",
      "length-of-last-word", "longest-common-prefix", "reverse-words-in-a-string",
      "zigzag-conversion", "find-the-index-of-the-first-occurrence-in-a-string",
      "text-justification",
      // Two Pointers
      "valid-palindrome", "is-subsequence", "two-sum-ii-input-array-is-sorted",
      "container-with-most-water", "3sum",
      // Sliding Window
      "minimum-size-subarray-sum", "longest-substring-without-repeating-characters",
      "substring-with-concatenation-of-all-words", "minimum-window-substring",
      // Matrix
      "valid-sudoku", "spiral-matrix", "rotate-image", "set-matrix-zeroes", "game-of-life",
      // Hashmap
      "ransom-note", "isomorphic-strings", "word-pattern", "valid-anagram", "group-anagrams",
      "two-sum", "happy-number", "contains-duplicate-ii", "longest-consecutive-sequence",
      // Intervals
      "summary-ranges", "merge-intervals", "insert-interval",
      "minimum-number-of-arrows-to-burst-balloons",
      // Stack
      "valid-parentheses", "simplify-path", "min-stack", "evaluate-reverse-polish-notation",
      "basic-calculator",
      // Linked List
      "linked-list-cycle", "add-two-numbers", "merge-two-sorted-lists",
      "copy-list-with-random-pointer", "reverse-linked-list-ii", "reverse-nodes-in-k-group",
      "remove-nth-node-from-end-of-list", "remove-duplicates-from-sorted-list-ii", "rotate-list",
      "partition-list", "lru-cache",
      // Binary Tree General
      "maximum-depth-of-binary-tree", "same-tree", "invert-binary-tree", "symmetric-tree",
      "construct-binary-tree-from-preorder-and-inorder-traversal",
      "construct-binary-tree-from-inorder-and-postorder-traversal",
      "populating-next-right-pointers-in-each-node-ii", "flatten-binary-tree-to-linked-list",
      "path-sum", "sum-root-to-leaf-numbers", "binary-tree-maximum-path-sum",
      "binary-search-tree-iterator", "count-complete-tree-nodes",
      "lowest-common-ancestor-of-a-binary-tree",
      // Binary Tree BFS
      "binary-tree-right-side-view", "average-of-levels-in-binary-tree",
      "binary-tree-level-order-traversal", "binary-tree-zigzag-level-order-traversal",
      // Binary Search Tree
      "minimum-absolute-difference-in-bst", "kth-smallest-element-in-a-bst",
      "validate-binary-search-tree",
      // Graph General
      "number-of-islands", "surrounded-regions", "clone-graph", "evaluate-division",
      "course-schedule", "course-schedule-ii",
      // Graph BFS
      "snakes-and-ladders", "minimum-genetic-mutation", "word-ladder",
      // Trie
      "implement-trie-prefix-tree", "design-add-and-search-words-data-structure", "word-search-ii",
      // Backtracking
      "letter-combinations-of-a-phone-number", "combinations", "permutations", "combination-sum",
      "n-queens-ii", "generate-parentheses", "word-search",
      // Divide & Conquer
      "convert-sorted-array-to-binary-search-tree", "sort-list", "construct-quad-tree",
      "merge-k-sorted-lists",
      // Kadane's Algorithm
      "maximum-subarray", "maximum-sum-circular-subarray",
      // Binary Search
      "search-insert-position", "search-a-2d-matrix", "find-peak-element",
      "search-in-rotated-sorted-array", "find-first-and-last-position-of-element-in-sorted-array",
      "find-minimum-in-rotated-sorted-array", "median-of-two-sorted-arrays",
      // Heap
      "kth-largest-element-in-an-array", "ipo", "find-k-pairs-with-smallest-sums",
      "find-median-from-data-stream",
      // Bit Manipulation
      "add-binary", "reverse-bits", "number-of-1-bits", "single-number", "single-number-ii",
      "bitwise-and-of-numbers-range",
      // Math
      "palindrome-number", "plus-one", "factorial-trailing-zeroes", "sqrtx", "powx-n",
      "max-points-on-a-line",
      // 1D DP
      "climbing-stairs", "house-robber", "word-break", "coin-change",
      "longest-increasing-subsequence",
      // Multidimensional DP
      "triangle", "minimum-path-sum", "unique-paths-ii", "longest-palindromic-substring",
      "interleaving-string", "edit-distance", "best-time-to-buy-and-sell-stock-iii",
      "best-time-to-buy-and-sell-stock-iv", "maximal-square",
    ],
  },
];
