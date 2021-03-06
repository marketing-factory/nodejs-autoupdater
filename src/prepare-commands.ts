import execa from "execa";

type RawCommand = string[] | {
  args: string[],
  cwd?: string,
  executable?: string
};

type CommandsShape = {
  [name: string]: (...args: any[]) => RawCommand
};

type ReadyCommands<Commands extends CommandsShape> = {
  [Property in keyof Commands]: (...args: Parameters<Commands[Property]>) => string;
};

/**
 * @example
 * const commands = prepareCommands('git', {
 *   commit: (message: string) => ['commit', '-m', message]
 * });
 * // Executes 'git commit -m "Hello world"' in a child process:
 * commands.commit('Hello world');
 */
export function prepareCommands<Commands extends CommandsShape>(defaultExecutable: string, commands: Commands, defaultCwd=process.cwd()): ReadyCommands<Commands> {
  type RC = ReadyCommands<Commands>;
  let readyCommands: RC = {} as RC;
  for (const command in commands) {

    readyCommands[command] = ((...args: string[]): string => {
      const rawCommand = commands[command](...args);
      let executable, commandArgs, cwd;

      if (Array.isArray(rawCommand)) {
        executable = defaultExecutable;
        commandArgs = rawCommand;
        cwd = defaultCwd;
      } else {
        executable = rawCommand.executable ?? defaultExecutable;
        commandArgs = rawCommand.args;
        cwd = rawCommand.cwd ?? defaultCwd;
      }

      return execa.sync(
        executable,
        commandArgs.filter(x => x.length), // remove empty strings
        { cwd, stdio: "pipe" }
      ).stdout.trim();
    });
    
  }
  return readyCommands;
}